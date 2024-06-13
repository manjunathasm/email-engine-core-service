export class User {
  id: string;
  email: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  profile: {
    Id: string;
    EmailAddress: string;
    DisplayName: string;
    Alias: string;
    MailboxGuid: string;
  };
  deltaLink: string;
  subscriptionId: string;
  subscriptionExpirationDateTime: string;
}
