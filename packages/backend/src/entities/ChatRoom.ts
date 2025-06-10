import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Message } from './Message';

@Entity()
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  userId!: string;

  @ManyToOne(() => User, user => user.chatRooms)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Message, message => message.chatRoom)
  messages!: Message[];
} 