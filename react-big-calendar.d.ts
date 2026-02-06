declare module 'react-big-calendar' {
  import { ComponentType } from 'react'

  export interface CalendarProps {
    localizer: any
    events: any[]
    startAccessor: string
    endAccessor: string
    style?: any
    views?: string[]
    defaultView?: string
    defaultDate?: Date
    dayPropGetter?: (date: Date) => any
    onSelectSlot?: (slotInfo: any) => void
    onNavigate?: () => void
    selectable?: boolean
    messages?: any
  }

  export const Calendar: ComponentType<CalendarProps>
  export function dateFnsLocalizer(config: any): any
}
