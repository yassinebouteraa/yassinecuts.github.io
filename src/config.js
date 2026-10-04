// Public, client-side configuration.
//
// Every value here is safe to ship in the bundle: the Supabase key is the
// *publishable* (anon) key and the Cloudinary preset is an unsigned one.
// What protects your data is Supabase Row Level Security, not secrecy —
// see supabase/rls-policies.sql.
export const SUPABASE_URL = 'https://sorjwworxlwyxtipxgcb.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_AQDK0RKux_i5eTsjJSXFPw_dNDUP9xP';

export const CLOUDINARY_CLOUD_NAME = 'dtxm5kfuk';
export const CLOUDINARY_UPLOAD_PRESET = 'Ai Video';

export const CONTACT_EMAIL = 'yassineebt12@gmail.com';

export const VIDEO_CATEGORIES = [
  'Talking Head',
  'E-commerce',
  'Cinematic',
  'Viral/Shorts',
  'UGC',
  'Other',
];

export const PACKAGE_OPTIONS = [
  { value: 'General Inquiry', label: 'General Inquiry' },
  { value: 'Basic Edit', label: 'Basic Edit ($49)' },
  { value: 'The Viral', label: 'The Viral ($149)' },
  { value: 'The Elite', label: 'The Elite ($299+)' },
  { value: 'Creator Package', label: 'Monthly Creator Package ($1290/mo)' },
];
