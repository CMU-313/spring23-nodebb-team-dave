export interface Stats {
  stats: Stat[]
}

export type Stat = {
  yesterday: number
  today: number
  lastweek: number
  thisweek: number
  lastmonth: number
  thismonth: number
  alltime: number
  dayIncrease: string
  dayTextClass: string
  weekIncrease: string
  weekTextClass: string
  monthIncrease: string
  monthTextClass: string
  name: string
} & StatOptionalProperties

export interface StatOptionalProperties {
  name: string
  href: string
}
