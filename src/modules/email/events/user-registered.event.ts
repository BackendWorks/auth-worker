/**
 * Event payload emitted by auth-service after a user successfully signs up.
 * Published to the RabbitMQ exchange with routing key 'user.registered'.
 */
export class UserRegisteredEvent {
  /** The newly-created user's ID */
  userId: string;

  /** The user's email address */
  email: string;

  /** The user's first name */
  firstName: string;

  /** ISO timestamp of when the user was created */
  createdAt: string;
}
