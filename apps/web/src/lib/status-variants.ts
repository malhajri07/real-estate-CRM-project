/** Shadcn Badge variant names for lead/client status */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'orange' | 'purple';

/** Lead/Client status → Shadcn Badge variant */
export const getLeadStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'new': return 'warning';
    case 'qualified': return 'info';
    case 'showing': return 'orange';
    case 'negotiating': return 'purple';
    case 'negotiation': return 'purple';
    case 'closed': return 'success';
    case 'lost': return 'destructive';
    case 'contacted': return 'warning';
    default: return 'secondary';
  }
};

/** Property status → Shadcn Badge variant */
export const getPropertyStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'available': return 'success';
    case 'active': return 'warning';
    case 'sold': return 'destructive';
    case 'withdrawn': return 'secondary';
    case 'pending': return 'info';
    default: return 'secondary';
  }
};

/** Notification/campaign lead status → Shadcn Badge variant */
export const getNotificationStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'new': return 'info';
    case 'contacted': return 'warning';
    case 'qualified': return 'success';
    case 'lost': return 'destructive';
    default: return 'secondary';
  }
};

/** Map page property status → Shadcn Badge variant */
export const getMapPropertyStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'active': return 'warning';
    case 'pending': return 'info';
    case 'sold': return 'success';
    case 'withdrawn': return 'destructive';
    default: return 'secondary';
  }
};

/** Calendar/appointment status → Shadcn Badge variant */
export const getCalendarStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'SCHEDULED': return 'info';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'destructive';
    case 'RESCHEDULED': return 'warning';
    default: return 'secondary';
  }
};
