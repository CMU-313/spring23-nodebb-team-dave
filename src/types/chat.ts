import { UserObjectSlim } from './user'

export interface MessageObject {
  content: string
  timestamp: number
  fromuid: number
  roomId: number
  deleted: boolean
  system: boolean
  edited: number
  timestampISO: string
  editedISO: string
  messageId: number
  fromUser: UserObjectSlim
  self: number
  newSet: boolean
  cleanedContent: string
}

export interface RoomObject {
  owner: number
  roomId: number
  roomName: string
  groupChat: boolean
}

export interface RoomUserList {
  users: UserObjectSlim[]
}

export type RoomObjectFull = {
  isOwner: boolean
  users: UserObjectSlim[]
  canReply: boolean
  groupChat: boolean
  usernames: string
  maximumUsersInChatRoom: number
  maximumChatMessageLength: number
  showUserInput: boolean
  isAdminOrGlobalMod: boolean
} & RoomObject & MessageObject
