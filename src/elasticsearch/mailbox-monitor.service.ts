import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common';
import { ElasticService } from 'src/elasticsearch/eleasticsearch.service';

@Injectable()
export class MailboxMonitorService {
  logger = new AppLogger(MailboxMonitorService.name, { timestamp: true });
  constructor(private readonly elasticService: ElasticService) {}

  async updateElasticsearch(
    email: string,
    fetchedEmails: any[],
  ): Promise<void> {
    try {
      // Fetch existing emails from Elasticsearch
      const existingEmails =
        await this.elasticService.getEmailsByUserEmail(email);

      // Identify new, updated, and deleted emails
      const { newEmails, updatedEmails, deletedEmailIds } = this.compareEmails(
        existingEmails,
        fetchedEmails,
      );

      // Index new and updated emails into Elasticsearch
      await this.elasticService.indexEmails(
        email,
        newEmails.concat(updatedEmails),
      );

      // Delete emails from Elasticsearch that are no longer present in the fetched list
      await this.elasticService.deleteEmails(email, deletedEmailIds);
    } catch (error) {
      this.logger.error('Error updating Elasticsearch:', error);
    }
  }

  compareEmails(
    existingEmails: any[],
    fetchedEmails: any[],
  ): { newEmails: any[]; updatedEmails: any[]; deletedEmailIds: string[] } {
    const newEmails = [];
    const updatedEmails = [];
    const deletedEmailIds = [];

    // Convert existing emails array to a map for efficient lookup
    const existingEmailsMap = new Map(
      existingEmails.map((email) => [email.Id, email]),
    );

    // Compare fetched emails with existing emails
    for (const fetchedEmail of fetchedEmails) {
      const existingEmail = existingEmailsMap.get(fetchedEmail.Id);
      if (existingEmail) {
        // Update existing email if it has been modified
        if (this.isEmailModified(existingEmail, fetchedEmail)) {
          updatedEmails.push(fetchedEmail);
        }
        // Remove the email from the map to track remaining existing emails
        existingEmailsMap.delete(fetchedEmail.Id);
      } else {
        // Add new email if it doesn't exist in the existing emails
        newEmails.push(fetchedEmail);
      }
    }

    // The remaining emails in the existing emails map are deleted
    deletedEmailIds.push(...existingEmailsMap.keys());

    return { newEmails, updatedEmails, deletedEmailIds };
  }

  isEmailModified(existingEmail: any, fetchedEmail: any): boolean {
    // Compare subject, body, Sender, ToRecipients, and attachments of existing and fetched emails
    return (
      existingEmail.Subject !== fetchedEmail.Subject ||
      existingEmail.BodyPreview !== fetchedEmail.BodyPreview ||
      !this.areArraysEqual(existingEmail.Sender, fetchedEmail.Sender) ||
      !this.areArraysEqual(
        existingEmail.ToRecipients,
        fetchedEmail.ToRecipients,
      )
    );
  }

  areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
}
