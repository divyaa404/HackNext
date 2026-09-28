export interface TimelineItem {
  id?: string;
  title: string;
  description?: string | null;
  start_datetime: string | Date;
  end_datetime?: string | Date | null;
  status?: string | null;
  sort_order?: number;
}

export interface EventWithTimeline {
  id?: string;
  name?: string;
  team_size_min?: number | null;
  team_size_max?: number | null;
  start_date: string | Date;
  end_date: string | Date;
  timeline_items?: TimelineItem[];
  [key: string]: any;
}

export interface RegistrationStatus {
  isOpen: boolean;
  isNotOpenYet: boolean;
  isClosed: boolean;
  opensAt?: Date;
  closesAt?: Date;
  message: string;
}

export interface SubmissionStatus {
  isOpen: boolean;
  isLocked: boolean;
  isClosed: boolean;
  opensAt: Date;
  closesAt: Date;
  message: string;
}

export function getRegistrationStatus(event?: EventWithTimeline | null): RegistrationStatus {
  if (!event) {
    return {
      isOpen: false,
      isNotOpenYet: true,
      isClosed: false,
      message: 'Registration is not open yet because no event is active.'
    };
  }

  const now = new Date();
  const items = event.timeline_items || [];

  const regItem = items.find(it => {
    const t = (it.title || '').toLowerCase();
    return t.includes('registration') || t.includes('register') || t.includes('sign up') || t.includes('team formation');
  });

  let opensAt: Date | undefined;
  let closesAt: Date | undefined;

  if (regItem) {
    opensAt = regItem.start_datetime ? new Date(regItem.start_datetime) : undefined;
    if (regItem.end_datetime) {
      closesAt = new Date(regItem.end_datetime);
    } else {
      const nextMilestone = items.find(it => new Date(it.start_datetime) > (opensAt as Date));
      closesAt = nextMilestone ? new Date(nextMilestone.start_datetime) : new Date(event.end_date || event.start_date);
    }
  } else {
    opensAt = event.start_date ? new Date(event.start_date) : undefined;
    closesAt = new Date(event.end_date || event.start_date);
  }

  // Ensure opensAt is valid, fallback to event.start_date
  if ((!opensAt || isNaN(opensAt.getTime())) && event.start_date) {
    opensAt = new Date(event.start_date);
  }
  // Ensure closesAt is valid, fallback to event.end_date
  if ((!closesAt || isNaN(closesAt.getTime())) && event.end_date) {
    closesAt = new Date(event.end_date);
  }

  // Check 1: Time has NOT started yet (now < opensAt)
  if (opensAt && !isNaN(opensAt.getTime()) && now.getTime() < opensAt.getTime()) {
    return {
      isOpen: false,
      isNotOpenYet: true,
      isClosed: false,
      opensAt,
      closesAt,
      message: `Team registration has not started yet. Registration opens on ${opensAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
    };
  }

  // Check 2: Time has passed / registration closed (now > closesAt)
  if (closesAt && !isNaN(closesAt.getTime()) && now.getTime() > closesAt.getTime()) {
    return {
      isOpen: false,
      isNotOpenYet: false,
      isClosed: true,
      opensAt,
      closesAt,
      message: `Team registration is closed. The deadline was ${closesAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
    };
  }

  return {
    isOpen: true,
    isNotOpenYet: false,
    isClosed: false,
    opensAt,
    closesAt,
    message: closesAt && !isNaN(closesAt.getTime())
      ? `Team registration is open until ${closesAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
      : 'Team registration is currently open.'
  };
}

export function getSubmissionStatus(event?: EventWithTimeline | null): SubmissionStatus {
  if (!event) {
    return {
      isOpen: true,
      isLocked: false,
      isClosed: false,
      opensAt: new Date(Date.now() - 1000),
      closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      message: 'Submissions are currently open.'
    };
  }

  const now = new Date();
  const items = event.timeline_items || [];

  // Find timeline milestone related to submission
  const subItem = items.find(it => {
    const t = (it.title || '').toLowerCase();
    return t.includes('submission') || t.includes('submitting') || t.includes('project submission');
  });

  let opensAt: Date = new Date(event.start_date);
  let closesAt: Date = new Date(event.end_date);

  if (subItem) {
    opensAt = new Date(subItem.start_datetime);
    closesAt = subItem.end_datetime ? new Date(subItem.end_datetime) : new Date(event.end_date);
  } else {
    const startItem = items.find(it => {
      const t = (it.title || '').toLowerCase();
      return t.includes('hackathon start') || t.includes('hacking start') || t.includes('submission open') || t.includes('submissions open') || t.includes('hacking begin') || t.includes('starts');
    });
    if (startItem) {
      opensAt = new Date(startItem.start_datetime);
    }

    const endItem = items.find(it => {
      const t = (it.title || '').toLowerCase();
      return t.includes('submission deadline') || t.includes('submission close') || t.includes('submissions end') || t.includes('hackathon end') || t.includes('hacking end') || t.includes('deadline');
    });
    if (endItem) {
      closesAt = new Date(endItem.end_datetime || endItem.start_datetime);
    }
  }

  if (!isNaN(opensAt.getTime()) && now < opensAt) {
    return {
      isOpen: false,
      isLocked: true,
      isClosed: false,
      opensAt,
      closesAt,
      message: `Submissions are locked. The submission window opens on ${opensAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
    };
  }

  if (!isNaN(closesAt.getTime()) && now > closesAt) {
    return {
      isOpen: false,
      isLocked: false,
      isClosed: true,
      opensAt,
      closesAt,
      message: `Submissions are closed. The deadline was ${closesAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
    };
  }

  return {
    isOpen: true,
    isLocked: false,
    isClosed: false,
    opensAt,
    closesAt,
    message: closesAt && !isNaN(closesAt.getTime())
      ? `Submissions are open until ${closesAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`
      : 'Submissions are open.'
  };
}
