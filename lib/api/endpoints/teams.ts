import type { ApiResponse } from '../api-client'
import { AxiosInstance } from 'axios'

export interface TeamMemberRecord {
  id: string
  teamId: string
  number: string
  name: string
  isActive: boolean
  deactivatedAt?: string | null
  createdAt: string
  aliases?: Array<{ id: string; teamMemberId: string; alias: string; normalizedAlias: string; createdAt: string }>
}

export interface Team {
  id: string
  name: string | null
  userId: string
  createdAt: string
  updatedAt: string
  members: TeamMemberRecord[]
}

export interface CreateTeamInput {
  name?: string
  members: Array<{ number: string; name: string; aliases?: string[] }>
}

export interface AddTeamMemberInput {
  number: string
  name: string
  aliases?: string[]
}

export interface UpdateTeamMemberInput {
  number?: string
  name?: string
  isActive?: boolean
  aliases?: string[]
}

/** Method signatures for Teams API; merged onto ApiClient. */
export interface TeamsApi {
  createTeam(data: CreateTeamInput): Promise<ApiResponse<{ team: Team }>>
  listTeams(): Promise<ApiResponse<{ teams: Team[] }>>
  getTeam(teamId: string): Promise<ApiResponse<{ team: Team }>>
  addTeamMember(teamId: string, data: AddTeamMemberInput): Promise<ApiResponse<{ member: TeamMemberRecord }>>
  updateTeamMember(
    teamId: string,
    memberId: string,
    data: UpdateTeamMemberInput
  ): Promise<ApiResponse<{ member: TeamMemberRecord }>>
}

export const teamsMethods = {
  async createTeam(this: { axiosInstance: AxiosInstance }, input: CreateTeamInput) {
    return await this.axiosInstance.post('/v1/teams', input)
  },

  async listTeams(this: { axiosInstance: AxiosInstance }) {
    return await this.axiosInstance.get('/v1/teams')
  },

  async getTeam(this: { axiosInstance: AxiosInstance }, teamId: string) {
    return await this.axiosInstance.get(`/v1/teams/${teamId}`)
  },

  async addTeamMember(this: { axiosInstance: AxiosInstance }, teamId: string, data: AddTeamMemberInput) {
    return await this.axiosInstance.post(`/v1/teams/${teamId}/members`, data)
  },

  async updateTeamMember(
    this: { axiosInstance: AxiosInstance },
    teamId: string,
    memberId: string,
    data: UpdateTeamMemberInput
  ) {
    return await this.axiosInstance.patch(`/v1/teams/${teamId}/members/${memberId}`, data)
  }
}
