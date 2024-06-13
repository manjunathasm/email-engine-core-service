import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { User } from 'src/user/user.interface';

@Injectable()
export class ElasticService {
  logger = new AppLogger(ElasticService.name, { timestamp: true });
  userIndex = process.env.ELASTICSEARCH_USER_INDEX || 'users';
  emailFoldersIndex =
    process.env.ELASTICSEARCH_EMAIL_FOLDER_INDEX || 'email_folders';
  emailIndex = process.env.ELASTICSEARCH_EMAIL_INDEX || 'emails';
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async createIndex() {
    // create index if doesn't exist
    try {
      const checkUserIndex = await this.elasticsearchService.indices.exists({
        index: this.userIndex,
      });
      const checkEmailFoldersIndex =
        await this.elasticsearchService.indices.exists({
          index: this.emailFoldersIndex,
        });
      const checkEmailIndex = await this.elasticsearchService.indices.exists({
        index: this.emailIndex,
      });

      if (!checkUserIndex) {
        this.elasticsearchService.indices.create({ index: this.userIndex });
      }
      if (!checkEmailFoldersIndex) {
        this.elasticsearchService.indices.create({
          index: this.emailFoldersIndex,
        });
      }
      if (!checkEmailIndex) {
        this.elasticsearchService.indices.create({ index: this.emailIndex });
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const body = await this.elasticsearchService.search({
        index: this.userIndex,
        body: {
          query: {
            match_all: {}, // Retrieve all documents
          },
        },
      });

      return body.hits.hits.map((hit) => hit._source as User); // Return the hits array containing documents
    } catch (error) {
      this.logger.error(
        `Error retrieving documents from ${this.userIndex}:`,
        '',
        '',
        error,
      );
      return []; // Return empty array on error
    }
  }

  async getUserByUserId(userId: string): Promise<User> {
    if (!userId) {
      throw new HttpException(
        'userId required.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
    try {
      const body = await this.elasticsearchService.search({
        index: this.userIndex,
        body: {
          query: {
            match: {
              userId,
            },
          },
          size: 1, // Limit the results to one document
        },
      });

      if (body.hits.hits.length > 0) {
        return body.hits.hits[0]._source as User;
      } else {
        return null; // No matching document found
      }
    } catch (error) {
      this.logger.error(
        `Error retrieving User with userId: ${userId}`,
        '',
        '',
        error,
      );
      throw error;
    }
  }

  async getUserBySubscriptionId(subscriptionId: string): Promise<User> {
    if (!subscriptionId) {
      throw new HttpException(
        'subscriptionId required.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
    try {
      const body = await this.elasticsearchService.search({
        index: this.userIndex,
        body: {
          query: {
            match: {
              subscriptionId,
            },
          },
          size: 1, // Limit the results to one document
        },
      });

      if (body.hits.hits.length > 0) {
        return body.hits.hits[0]._source as User;
      } else {
        return null; // No matching document found
      }
    } catch (error) {
      this.logger.error(
        `Error retrieving User with subscriptionId: ${subscriptionId}`,
        '',
        '',
        error,
      );
      throw error;
    }
  }

  async getById(id: string, index: string) {
    if (!id) {
      throw new HttpException('id required.', HttpStatus.EXPECTATION_FAILED);
    }
    try {
      const data = await this.elasticsearchService.get({
        index,
        id,
      });
      return data._source;
    } catch (error) {
      if (error.meta && error.meta.statusCode === 404) {
        this.logger.log('Document not found');
        return null;
      } else if (error.name === 'ConnectionError') {
        throw new HttpException(
          'Unable to connect to Elasticsearch',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          `Error retrieving document: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getEmailsByUserEmail(userEmail: string): Promise<any[]> {
    try {
      const response = await this.elasticsearchService.search({
        index: this.emailIndex,
        body: {
          query: {
            match: {
              userEmail,
            },
          },
        },
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Error searching emails in Elasticsearch:', error);
      return [];
    }
  }

  async getFoldersByUserEmail(userEmail: string): Promise<any[]> {
    if (!userEmail) {
      throw new HttpException(
        'userEmail required.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
    const response = await this.elasticsearchService.search({
      index: this.emailFoldersIndex,
      body: {
        query: {
          match: {
            userEmail,
          },
        },
      },
    });

    return response.hits.hits.map((hit) => hit._source);
  }

  async getEmails(
    userEmail: string,
    parentFolderId: string,
    page = 1,
    pageSize = 10,
  ) {
    if (!userEmail || !parentFolderId) {
      throw new HttpException(
        'userEmail and parentFolderId are required.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }

    const response = await this.elasticsearchService.search({
      index: this.emailIndex,
      body: {
        query: {
          bool: {
            must: [
              { match: { userEmail } }, // Match userEmail
              { match: { 'ParentFolderId.keyword': parentFolderId } }, // Match ParentFolderId exactly
            ],
          },
        },
        sort: [{ ReceivedDateTime: { order: 'desc' } }],
        from: (page - 1) * pageSize,
        size: pageSize,
      },
    });

    return {
      total: response.hits.total,
      page,
      pageSize,
      emails: response.hits.hits.map((hit) => hit._source),
    };
  }

  async searchEmails(q: string, userEmail: string, page = 1, pageSize = 10) {
    if (!q || !userEmail) {
      throw new HttpException(
        'q and userEmail are required.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }

    const response = await this.elasticsearchService.search({
      index: this.emailIndex,
      body: {
        query: {
          bool: {
            must: [
              {
                query_string: {
                  query: `*${q}*`,
                  fields: [
                    'Subject',
                    'BodyPreview',
                    'Sender.EmailAddress.Name',
                    'Sender.EmailAddress.Address',
                    'From.EmailAddress.Name',
                    'From.EmailAddress.Address',
                    'ToRecipients.EmailAddress.Name',
                    'ToRecipients.EmailAddress.Address',
                  ],
                  default_operator: 'AND',
                },
              },
            ],
          },
        },
        sort: [{ ReceivedDateTime: { order: 'desc' } }],
        from: (page - 1) * pageSize,
        size: pageSize,
      },
    });

    return {
      total: response.hits.total,
      page,
      pageSize,
      emails: response.hits.hits.map((hit) => hit._source),
    };
  }

  async indexUser(userEmail: string, user: Partial<User>): Promise<void> {
    try {
      const existingUser: any = await this.getById(userEmail, this.userIndex);
      const newUser = { ...existingUser, ...user };
      await this.elasticsearchService.index({
        index: this.userIndex,
        op_type: 'index',
        id: userEmail,
        document: newUser,
        refresh: true,
      });

      this.logger.log(`Indexed user ${userEmail}`);
    } catch (error) {
      this.logger.error('Error indexing user in Elasticsearch:', error);
    }
  }

  async indexEmailsFolders(userEmail: string, folders: any[]): Promise<void> {
    try {
      const bulkIndex = folders.flatMap((folder) => [
        {
          index: { _index: this.emailFoldersIndex, _id: folder.Id },
        },
        { ...folder, userEmail },
      ]);

      await this.elasticsearchService.bulk({ body: bulkIndex });

      this.logger.log(
        `Indexed ${folders.length} folders for user ${userEmail}`,
      );
    } catch (error) {
      this.logger.error('Error indexing emails in Elasticsearch:', error);
    }
  }

  async indexEmails(userEmail: string, emails: any[]): Promise<void> {
    try {
      const bulkIndex = emails.flatMap((email) => [
        {
          index: { _index: this.emailIndex, _id: email.Id },
        },
        { ...email, userEmail },
      ]);

      await this.elasticsearchService.bulk({ body: bulkIndex });

      this.logger.log(`Indexed ${emails.length} emails for user ${userEmail}`);
    } catch (error) {
      this.logger.error('Error indexing emails in Elasticsearch:', error);
    }
  }

  async deleteAllEmailsByIndex(index: string): Promise<void> {
    try {
      const response = await this.elasticsearchService.deleteByQuery({
        index,
        body: {
          query: {
            match_all: {},
          },
        },
      });

      this.logger.log(
        `Deleted all documents from index ${index}, response: ${JSON.stringify(response)}`,
      );
    } catch (error) {
      this.logger.error(
        'Error deleting all documents from Elasticsearch:',
        error,
      );
    }
  }

  async deleteEmails(userEmail: string, emailIds: string[]): Promise<void> {
    try {
      if (emailIds.length === 0) {
        this.logger.warn('No email IDs provided for deletion.');
        return;
      }

      // Create the bulk delete operations
      const bulkDelete = emailIds.flatMap((id) => [
        { delete: { _index: this.emailIndex, _id: id } },
      ]);

      this.logger.log(
        `Bulk delete request body: ${JSON.stringify(bulkDelete, null, 2)}`,
      );

      // Send the bulk request to Elasticsearch
      const response = await this.elasticsearchService.bulk({
        body: bulkDelete,
      });

      if (response.errors) {
        this.logger.error(
          'Errors occurred during the bulk delete operation: ' +
            JSON.stringify(response.items),
        );
      } else {
        this.logger.log(
          `Deleted ${emailIds.length} emails for user ${userEmail}`,
        );
      }
    } catch (error) {
      this.logger.error('Error deleting emails from Elasticsearch:', error);
    }
  }

  async clearMailboxData(userEmail: string) {
    await this.elasticsearchService.deleteByQuery({
      index: this.emailIndex,
      body: {
        query: {
          match: {
            userEmail,
          },
        },
      },
    });
    await this.elasticsearchService.deleteByQuery({
      index: this.emailFoldersIndex,
      body: {
        query: {
          match: {
            userEmail,
          },
        },
      },
    });
    await this.elasticsearchService.deleteByQuery({
      index: this.userIndex,
      body: {
        query: {
          match: {
            email: userEmail,
          },
        },
      },
    });
  }
}
