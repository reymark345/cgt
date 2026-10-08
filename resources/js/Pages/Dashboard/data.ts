import type { RecordItem } from './types';

export const officeTabs = ['BATCH 1', 'BATCH 2', 'BATCH 3', 'BATCH 4', 'BATCH 5'];
export const statusTabs = ['All', 'Pending', 'For Review', 'Flagged', 'Cancelled', 'Verified'];

const emvDefaults = {
  region: 'Caraga',
  province: 'Agusan del Norte',
  municipality: 'Butuan City',
  barangay: 'Doongan',
  purok: 'Purok 1',
  address: 'Doongan, Butuan City, Agusan del Norte',
  hh_id: '160201000001',
  entryid: 'ENT-000001',
  lastname: 'Dela Cruz',
  firstname: 'Juan',
  middlename: 'Santos',
  extensionname: '',
  birthday: 'Jan 15, 1985',
  age: 41,
  clientstatus: 'Active',
  member_status: 'Member',
  registrationstatus: 'Registered',
  sex: 'Male',
  relationship_to_hh_head: 'Head',
  ipaffiliation: 'None',
  hh_set: 'Set 1',
  group: 'Group A',
  mothers_maiden: 'Maria Santos',
  date_of_enumeration: 'Aug 01, 2026',
  lbp_account_number: 'LANDBANK **** 4812',
  mode_of_payment: 'Cash Card',
  date_tagged_hhstatus: 'Aug 05, 2026',
  tagged_by: 'RN',
  date_registered: 'Aug 10, 2026',
};

export const initialRecords: RecordItem[] = [
  { ...emvDefaults, id: 1, office: 'Property', reference: '26-06-0678', type: 'Procurement', status: 'Verified', supplier: 'KIMSON COMMERCIAL', deliveryDate: 'Jul 15, 2026', transactionDate: 'Aug 11, 2026 11:48 AM', amount: 70715, inventoryType: 'Office Supplies Inventory', jevNo: '26-08-1446', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 2, office: 'HFG', hh_id: '160201000002', entryid: 'ENT-000002', lastname: 'Santos', firstname: 'Maria', middlename: 'Reyes', sex: 'Female', reference: '26-06-0691', type: 'Procurement', status: 'Verified', supplier: 'COLUMBIA COMPUTER CENTER INC.', deliveryDate: 'Jul 15, 2026', transactionDate: 'Aug 11, 2026 11:45 AM', amount: 27875, inventoryType: 'Office Supplies Inventory', jevNo: '26-07-14161', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 3, office: 'RRCY', hh_id: '160201000003', entryid: 'ENT-000003', lastname: 'Reyes', firstname: 'Pedro', middlename: 'Lim', barangay: 'Ampayon', address: 'Ampayon, Butuan City, Agusan del Norte', reference: '26-06-0728', type: 'Procurement', status: 'Verified', supplier: 'HI-SEAS EXPRESS PHARMACY', deliveryDate: 'Jul 22, 2026', transactionDate: 'Aug 11, 2026 11:43 AM', amount: 25564, inventoryType: 'Other Supplies and Materials for Distribution', jevNo: '26-08-14624', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 4, office: 'DRMD', hh_id: '160201000004', entryid: 'ENT-000004', lastname: 'Garcia', firstname: 'Ana', middlename: 'Lopez', sex: 'Female', reference: '26-05-0515', type: 'Procurement', status: 'Verified', supplier: 'A-LINE TRADING', deliveryDate: 'Jun 29, 2026', transactionDate: 'Aug 11, 2026 11:37 AM', amount: 81325, inventoryType: 'Other Supplies and Materials Inventory', jevNo: '26-08-14395', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 5, office: 'Property', hh_id: '160201000005', entryid: 'ENT-000005', lastname: 'Torres', firstname: 'Luis', middlename: 'Cruz', status: 'Pending', reference: '26-03-0353', type: 'Procurement', supplier: 'DYNAMIC HARDWARE AND CONSTRUCTION SUPPLIES', deliveryDate: 'Jun 22, 2026', transactionDate: 'Aug 11, 2026 11:33 AM', amount: 84440, inventoryType: 'Other Supplies and Materials for Distribution', jevNo: '26-08-14394', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 6, office: 'HFG', hh_id: '160201000006', entryid: 'ENT-000006', lastname: 'Mendoza', firstname: 'Elena', middlename: 'Dizon', sex: 'Female', status: 'Flagged', reference: '25-09-1762', type: 'Procurement', supplier: 'MERCADO S SUDLANAN ATBP.', deliveryDate: 'May 12, 2026', transactionDate: 'Aug 04, 2026 1:58 PM', amount: 21500, inventoryType: 'Other Supplies and Materials for Distribution', jevNo: '26-08-14286', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 07, 2026', updatedAt: 'Aug 07, 2026' },
  { ...emvDefaults, id: 7, office: 'RRCY', hh_id: '160201000007', entryid: 'ENT-000007', lastname: 'Flores', firstname: 'Ramon', middlename: 'Uy', reference: '26-07-0789', type: 'Donation', status: 'Verified', supplier: 'KIMSON COMMERCIAL', deliveryDate: 'Jul 22, 2026', transactionDate: 'Jul 30, 2026 4:06 PM', amount: 132000, inventoryType: 'Office Supplies Inventory', jevNo: '26-08-14445', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 07, 2026', updatedAt: 'Aug 07, 2026' },
  { ...emvDefaults, id: 8, office: 'DRMD', hh_id: '160201000008', entryid: 'ENT-000008', lastname: 'Navarro', firstname: 'Liza', middlename: 'Tan', sex: 'Female', status: 'For Review', reference: '26-06-0705', type: 'Procurement', supplier: 'DATAONE COMPUTER TRADING', deliveryDate: 'Jul 21, 2026', transactionDate: 'Jul 30, 2026 4:04 PM', amount: 18000, inventoryType: 'Office Supplies Inventory', jevNo: '26-08-14487', jevDate: 'Aug 04, 2026', createdBy: 'RN', createdAt: 'Aug 11, 2026', updatedAt: 'Aug 11, 2026' },
  { ...emvDefaults, id: 9, office: 'MDRC', hh_id: '160201000009', entryid: 'ENT-000009', lastname: 'Bautista', firstname: 'Nora', middlename: 'Sy', sex: 'Female', status: 'Cancelled', reference: '26-06-0638', type: 'Transfer', supplier: 'KIMSON COMMERCIAL', deliveryDate: 'Jun 15, 2026', transactionDate: 'Jul 29, 2026 5:20 PM', amount: 6000, inventoryType: 'Office Supplies Inventory', jevNo: '26-07-14120', jevDate: 'Jul 01, 2026', createdBy: 'RN', createdAt: 'Jul 29, 2026', updatedAt: 'Jul 29, 2026' },
  { ...emvDefaults, id: 10, office: 'Property', hh_id: '160201000010', entryid: 'ENT-000010', lastname: 'Cortez', firstname: 'Mario', middlename: 'Diaz', reference: '26-03-0302', type: 'Procurement', status: 'Verified', supplier: 'BSU PRINTS AND GARMENTS', deliveryDate: 'May 28, 2026', transactionDate: 'Jul 28, 2026 2:36 PM', amount: 13500, inventoryType: 'Other Supplies and Materials for Distribution', jevNo: '26-07-14002', jevDate: 'Jul 01, 2026', createdBy: 'RN', createdAt: 'Jul 28, 2026', updatedAt: 'Jul 28, 2026' },
  { ...emvDefaults, id: 11, office: 'Property', hh_id: '160201000011', entryid: 'ENT-000011', lastname: 'Ramos', firstname: 'Clara', middlename: 'Velasco', sex: 'Female', reference: '26-02-0254', type: 'Procurement', status: 'Verified', supplier: 'METRO OFFICE SUPPLIES', deliveryDate: 'Apr 18, 2026', transactionDate: 'Jul 24, 2026 9:18 AM', amount: 43200, inventoryType: 'Office Supplies Inventory', jevNo: '26-07-13955', jevDate: 'Jul 01, 2026', createdBy: 'RN', createdAt: 'Jul 24, 2026', updatedAt: 'Jul 24, 2026' },
  { ...emvDefaults, id: 12, office: 'HFG', hh_id: '160201000012', entryid: 'ENT-000012', lastname: 'Aquino', firstname: 'Ben', middlename: 'Magsino', status: 'Pending', reference: '26-01-0188', type: 'Donation', supplier: 'CARAGA MEDICAL SUPPLIES', deliveryDate: 'Apr 01, 2026', transactionDate: 'Jul 22, 2026 10:12 AM', amount: 9250, inventoryType: 'Medical Supplies Inventory', jevNo: '26-07-13902', jevDate: 'Jul 01, 2026', createdBy: 'RN', createdAt: 'Jul 22, 2026', updatedAt: 'Jul 22, 2026' },
];




