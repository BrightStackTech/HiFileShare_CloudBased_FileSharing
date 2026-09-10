import { useState, useRef } from 'react';
import { Camera, Edit3, KeyRound, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { authApi, userApi } from '../services/api';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const Profile: React.FC = () => {
  const { user, clearAuth, updateUser } = useAuthStore();
  const navigate = useNavigate();

  // Edit Profile States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || '', username: user?.username || '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [changePassOpen, setChangePassOpen] = useState(false);
  const [passForm, setPassForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [changingPass, setChangingPass] = useState(false);

  // Account Deletion states
  const [deleteAccountStep, setDeleteAccountStep] = useState<0 | 1 | 2 | 3>(0);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Logout state
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.current || !passForm.newPass || !passForm.confirm) {
      toast.error('All fields are required');
      return;
    }
    if (passForm.newPass !== passForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passForm.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPass(true);
    try {
      await authApi.changePassword(passForm.current, passForm.newPass, passForm.confirm);
      toast.success('Password changed successfully!');
      setChangePassOpen(false);
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setImageToCrop(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
      e.target.value = ''; // Reset input
    }
  };

  const handleSaveCrop = async () => {
    if (typeof cropperRef.current?.cropper !== 'undefined') {
      const cropper = cropperRef.current.cropper;
      cropper.getCroppedCanvas({ width: 400, height: 400, fillColor: '#fff' }).toBlob(async (blob) => {
        if (!blob) return;
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('pfp', blob, 'profile.jpg');
        try {
          const res = await userApi.updateMe(formData);
          updateUser(res.data.user);
          toast.success('Profile picture updated successfully!');
          setImageToCrop(null);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to update profile picture');
        } finally {
          setUploadingImage(false);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.username.trim()) {
      toast.error('Name and username are required');
      return;
    }
    setUpdatingProfile(true);
    const formData = new FormData();
    formData.append('name', editForm.name.trim());
    formData.append('username', editForm.username.trim());
    try {
      const res = await userApi.updateMe(formData);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
      setEditProfileOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountStep(3);
    try {
      await userApi.deleteAccount();
      clearAuth();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete account');
      setDeleteAccountStep(0);
    }
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (!user) return null;

  return (
    <>
      <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your account settings</p>
        </div>

        {/* Avatar card */}
        <div className="card p-8 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            {user.pfpUrl ? (
              <img
                src={user.pfpUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-500/20 shadow-xl"
              />
            ) : (
              <div className="avatar w-24 h-24 text-3xl ring-4 ring-primary-500/20 shadow-xl">
                {getInitials(user.name)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm font-mono text-slate-400 dark:text-slate-500 mt-0.5">{user.username}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{user.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <p className="px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Account
          </p>

          {/* Edit PFP */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button
            id="edit-pfp-btn"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Edit Profile Picture</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Update your avatar</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </button>

          {/* Edit Name */}
          <button
            id="edit-name-btn"
            onClick={() => { setEditForm({ name: user.name, username: user.username }); setEditProfileOpen(true); }}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Edit Display Name & Username</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Update your public identity</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </button>

          {/* Change Password */}
          <button
            id="change-password-btn"
            onClick={() => setChangePassOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Change Password</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Update your security credentials</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </button>
        </div>

        {/* Danger zone */}
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <p className="px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-widest">
            Danger Zone
          </p>
          <button
            id="logout-btn"
            onClick={() => setLogoutModalOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Logout</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Sign out of your account</p>
            </div>
          </button>
          
          {/* Delete Account */}
          <button
            id="delete-account-btn"
            onClick={() => setDeleteAccountStep(1)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete this account</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Permanently remove your data</p>
            </div>
          </button>
        </div>

        {/* Account info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Account Info</p>
          </div>
          <dl className="space-y-2">
            {[
              { label: 'Display Name', value: user.name },
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <dt className="text-xs text-slate-400 dark:text-slate-500">{label}</dt>
                <dd className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={changePassOpen} onClose={() => setChangePassOpen(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { id: 'current-pass', key: 'current' as const, label: 'Current Password', placeholder: 'Your current password' },
            { id: 'new-pass', key: 'newPass' as const, label: 'New Password', placeholder: 'Min 6 characters' },
            { id: 'confirm-pass', key: 'confirm' as const, label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(({ id, key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  id={id}
                  type={showPass[key] ? 'text' : 'password'}
                  value={passForm[key]}
                  onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass({ ...showPass, [key]: !showPass[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                >
                  {showPass[key] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
          <button
            id="save-password-btn"
            type="submit"
            disabled={changingPass}
            className="btn-primary w-full justify-center"
          >
            {changingPass ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={editProfileOpen} onClose={() => !updatingProfile && setEditProfileOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Your display name"
              className="input-field"
              disabled={updatingProfile}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase() })}
              placeholder="johny#1234"
              className="input-field"
              disabled={updatingProfile}
            />
            <p className="text-xs text-slate-500 mt-1">Must be at least 5 letters, followed by # and 4 digits.</p>
          </div>
          <button
            type="submit"
            disabled={updatingProfile}
            className="btn-primary w-full justify-center"
          >
            {updatingProfile ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Cropper Modal */}
      <Modal isOpen={!!imageToCrop} onClose={() => !uploadingImage && setImageToCrop(null)} title="Crop Profile Picture">
        <div className="flex flex-col gap-4">
          <div className="w-full max-h-[60vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            {imageToCrop && (
              <Cropper
                ref={cropperRef}
                src={imageToCrop}
                style={{ height: 400, width: '100%' }}
                aspectRatio={1}
                guides={true}
                viewMode={1}
                dragMode="move"
                background={false}
                autoCropArea={1}
                checkOrientation={false} // Disable to avoid rotation issues on mobile uploads
              />
            )}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => setImageToCrop(null)}
              disabled={uploadingImage}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={uploadingImage}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              {uploadingImage ? 'Saving...' : 'Save Image'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Are you sure?"
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to logout? Once logged out, you will need to enter your credentials to login again.
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </Modal>

      {/* Account Deletion Step 1 */}
      <Modal
        isOpen={deleteAccountStep === 1}
        onClose={() => { setDeleteAccountStep(0); setDeleteChecked(false); }}
        title="Are you sure?"
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Account will get permanently deleted and can't be recovered.
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-red-500 focus:ring-red-500"
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              I've read and know the consequences
            </span>
          </label>
          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={() => { setDeleteAccountStep(0); setDeleteChecked(false); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!deleteChecked}
              onClick={() => setDeleteAccountStep(2)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Yes, Permanently delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Account Deletion Step 2 */}
      <Modal
        isOpen={deleteAccountStep === 2}
        onClose={() => { setDeleteAccountStep(0); setDeleteConfirmText(''); }}
        title="We feel sorry to see you go"
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Please type <span className="font-bold select-all">confirm</span> below to proceed.
          </div>
          <input
            type="text"
            className="input w-full py-2 px-1"
            placeholder="Type confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={() => { setDeleteAccountStep(0); setDeleteConfirmText(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={deleteConfirmText !== 'confirm'}
              onClick={handleDeleteAccount}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Account Deletion Step 3 (Loading) */}
      <Modal
        isOpen={deleteAccountStep === 3}
        onClose={() => {}}
        title="Deleting Account..."
      >
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Erasing account data...
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Profile;
