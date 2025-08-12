export interface ApiResponse<T> {
  code: number
  msg: string
  data?: T
} 

export interface RoleVO {
  id: number
  roleName: string
  roleCode: string
  description: string
  status: number
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  avatar: string
  status: number
  createdAt: string
  updatedAt: string
  lastLoginTime: string
  lastLoginIp: string
  isDeleted: string
  roles: RoleVO[]
}

export interface LoginResponseData {
  token: string
  userInfo: UserInfo
}
