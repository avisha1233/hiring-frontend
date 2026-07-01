const normalizeApplicationStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

const APPLICATION_STATUS_ACTIONS = {
  applied: {
    statusLabel: "Applied",
    primaryAction: {
      label: "Move Forward",
      nextStatus: "interviewing",
      tone: "emerald",
    },
    secondaryAction: {
      label: "Reject",
      nextStatus: "rejected",
      tone: "rose",
    },
  },
  interviewing: {
    statusLabel: "Interviewing",
    primaryAction: {
      label: "Schedule",
      nextStatus: null,
      tone: "amber",
      type: "schedule",
    },
    secondaryAction: {
      label: "Reject",
      nextStatus: "rejected",
      tone: "rose",
    },
  },
  hired: {
    statusLabel: "Hired",
    primaryAction: null,
    secondaryAction: null,
  },
  rejected: {
    statusLabel: "Rejected",
    primaryAction: null,
    secondaryAction: null,
  },
};

const getApplicationStatusActions = (status) =>
  APPLICATION_STATUS_ACTIONS[normalizeApplicationStatus(status)] ||
  APPLICATION_STATUS_ACTIONS.applied;

export {
  APPLICATION_STATUS_ACTIONS,
  getApplicationStatusActions,
  normalizeApplicationStatus,
};
