import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatRoom } from './ChatRoom';
import { Message } from './Message';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChatRoom, chatRoom => chatRoom.user)
  chatRooms!: ChatRoom[];

  @OneToMany(() => Message, message => message.user)
  messages!: Message[];
} 