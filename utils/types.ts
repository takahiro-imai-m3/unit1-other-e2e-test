export type GrantedAction = {
  system_code: number;
  action_key: number;
  action: string;
  action_description: string;
  activity_id: number;
  amount: number;
  company_key: string | null;
  company_code: string | null;
  memo: string;
  admin_user_name: string | null;
  created_time: string
};

export type uploadDcfDrList = {
  dcfCode: string;
  doctorName: string;
  facilityName: string;
  facilityAddress: string;
  facilityTel: string;
  mrName: string;
  doctorNameKana: string;
};

export type MessageHeader = {
  id: number;
  messageBodyId: number;
  fieldMrId: number;
  systemCode: string;
  insertionMessage: string;
  sendTime: string | null;
  mrOpenedTime: string | null;
  doctorOpenedTime: string | null;
  contentsClickedTime: string | null;
  mrCanceledTime: string | null;
  parentId: number | null;
  rootId: number | null;
  firstRepliedTime: string | null;
  editedInsertionMessage: boolean;
  yesnoButtonEnabled: boolean;
  messagePhotoId: number | null;
  stampSetId: number | null;
  doctorOpenedType: string | null;
  dataViewClickedTime: string | null;
  replyType: string;
  replyStampId: number | null;
  firstSendTime: string | null;
  afterStampQfbMessageBodyId: number | null;
  afterStampAutoReplyMessageBodyId: number | null;
  createdTime: string;
  updatedTime: string;
  updatedBy: string;
  deletedTime: string | null;
  version: number;
};

export type MessageBody = {
  id: number;
  messageType: string;
  clientId: number;
  title: string;
  bodyText: string;
  medicineId: number | null;
  sendDueTime: string | null;
  deliveredTime: string | null;
  canceledTime: string | null;
  cancellationReason: string | null;
  quickFeedback: boolean;
  contentsId: number | null;
  fileAttached: boolean;
  displayEndTime: string | null;
  wideScreenEnabled: boolean;
  spMessageType: string;
  spBodyText: string;
  mailDetailBodyText: string;
  pointGrant: boolean;
  mailDetailType: string;
  targetFileName: string | null;
  preparedDeliveredTime: string | null;
  seriesId: number | null;
  subserveQfbAnswer: boolean;
  reviewStatus: string;
  approvalStatus: string;
  stampSetId: number | null;
  afterStampQfbId: number | null;
  qfbRegisteredId: number | null;
  referenceCode: string | null;
  referenceId: number | null;
  reusedId: number | null;
  isAfterStampAutoReply: boolean;
  description: string | null;
  isSubdivideDistribution: boolean;
  originalMessageBodyId: number | null;
  copyIndex: number;
  doctorExpireIntervalMinute: number | null;
  createdTime: string;
  updatedTime: string;
  updatedBy: string;
  deletedTime: string | null;
  version: number;
};

export type MessageApiResponse = {
  header: MessageHeader;
  body: MessageBody;
};
