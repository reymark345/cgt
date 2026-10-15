import type { LucideIcon } from 'lucide-react';

export type RecordStatus = 'Verified' | 'Pending' | 'For Review' | 'Flagged' | 'Cancelled';

export type RecordItem = {
  id: number;
  office: string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  purok: string;
  address: string;
  hh_id: string;
  entryid: string;
  lastname: string;
  firstname: string;
  middlename: string;
  extensionname: string;
  birthday: string;
  age: number;
  clientstatus: string;
  member_status: string;
  registrationstatus: string;
  sex: string;
  relationship_to_hh_head: string;
  ipaffiliation: string;
  hh_set: string;
  group: string;
  mothers_maiden: string;
  date_of_enumeration: string;
  lbp_account_number: string;
  mode_of_payment: string;
  date_tagged_hhstatus: string;
  tagged_by: string;
  date_registered: string;
  reference: string;
  type: string;
  status: RecordStatus;
  supplier: string;
  deliveryDate: string;
  transactionDate: string;
  amount: number;
  inventoryType: string;
  jevNo: string;
  jevDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SortKey = keyof RecordItem;

export type CurrentView =
  | 'dashboard'
  | 'grantee'
  | 'emv-database'
  | 'emv-payroll'
  | 'aging'
  | 'overpayment'
  | 'users'
  | 'roles-permissions'
  | 'audit-trail'
  | 'directory'
  | 'Inquiry'
  | 'inquiry'
  | 'open'
  | 'data'
  | 'opening'
  | 'distribution'
  | 'otc-withdrawal'
  | 'replacement'
  | 'transfer-of-fund'
  | 'force-pin'
  | 'locking'
  | 'lifting';

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export type GranteeRecord = {
  id: number | string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  purok: string;
  district: string;
  hh_id: string;
  entry_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  maiden_name: string;
  contact_number: string;
  birthday: string;
  hh_grantee: string;
  current_age: number | string;
  age: number | string;
  sex: string;
  old_client_status: string;
  client_status: string;
  date_tagged: string;
  tagged_by: string;
  cs_category: string;
  member_status: string;
  relation_to_hh: string;
  hh_set: string;
  registration_status: string;
  ip_label: string;
  ip_status: string;
  payment_mode: string;
  lbp_account: string;
  date_of_enumeration: string;
  date_registered: string;
  date_registered_v2: string;
  family_id: string;
  rel_to_fam_head: string;
  selected_family: string;
  final_l3_result: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GranteeSortKey = keyof GranteeRecord;

export type EmvDatabaseRecord = {
  id: number | string;
  item_no: number | string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  hh_id: string;
  lbp_account: string;
  run_date: string;
  first_name: string;
  mid_name: string;
  last_name: string;
  acct_description: string;
  cct_type: string;
  lbp_servicing_branch: string;
  distribution_status: string;
  date_claimed: string;
  reason_why_unclaimed: string;
  recommended_action: string;
  action_taken: string;
  date_acted: string;
  agreed_distribution_date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EmvSortKey = keyof EmvDatabaseRecord;

export type PayrollRecord = {
  id: number | string;
  period: string;
  year: number | string;
  payroll_description: string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  address_psgc: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  household_id: string;
  payment_mode_classification: string;
  mode_of_payment: string;
  account_number: string;
  payroll_date: string;
  finance_approval: string;
  educ_dc_elem: number;
  educ_jr_hs: number;
  educ_sr_hs: number;
  educ_total_hs: number;
  total_educ: number;
  health: number;
  rice_amount: number;
  f1kd_amount: number;
  gross_amount: number;
  adjustment_amount: number;
  net_amount: number;
  hh_set: string;
  set_group: string;
  new_account_number?: string | null;
  status?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PayrollSortKey = keyof PayrollRecord;

export type RequestOptionItem = {
  id: number;
  name: string;
  label?: string | null;
  description?: string | null;
  status?: string;
};

export type HouseholdRequestItem = {
  id: number;
  hh_id: string;
  request_name: string;
  request_label: string;
  beneficiary_name?: string | null;
  remarks?: string | null;
  status: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InquirySummary = {
  full_name: string;
  location: string;
  client_status: string | null;
  grantee_count: number;
  emv_count: number;
  payroll_count: number;
  request_count?: number;
  total_gross: number;
  total_net: number;
  total_adjustments: number;
};

export type InquiryResult = {
  success: boolean;
  exists?: boolean;
  query: string;
  display_hhid: string;
  total_matches: number;
  summary: InquirySummary;
  grantee: GranteeRecord | null;
  grantees: GranteeRecord[];
  emv_records: EmvDatabaseRecord[];
  payroll_records: PayrollRecord[];
  requests?: HouseholdRequestItem[];
};

export type TopMunicipalityStat = {
  municipality: string;
  count: number;
};

export type DashboardMetrics = {
  emv: {
    total: number;
    claimed: number;
    unclaimed: number;
    rcct: number;
    mcct: number;
    claimedPercentage: number;
  };
  grantee: {
    total: number;
    active: number;
    graduated: number;
    other: number;
    activePercentage: number;
  };
  payroll: {
    total: number;
    gross: number;
    net: number;
    withholdings: number;
    period: string;
  };
  requests: {
    total: number;
    pending: number;
  };
  moduleCounts?: Record<string, number>;
  recentRequests?: HouseholdRequestItem[];
  topMunicipalities: TopMunicipalityStat[];
};
