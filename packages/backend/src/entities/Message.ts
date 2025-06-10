import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { ChatRoom } from './ChatRoom';

export enum MessageType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.USER
  })
  type!: MessageType;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  userId!: string;

  @Column()
  chatRoomId!: string;

  @ManyToOne(() => User, user => user.messages)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => ChatRoom, chatRoom => chatRoom.messages)
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom!: ChatRoom;
} 