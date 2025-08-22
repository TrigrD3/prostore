import { Metadata } from 'next';
import ProfileForm from './profile-form';

export const metadata: Metadata = {
  title: 'Customer Profile',
};

// NOTE: here we can remove the SessionProvider
const Profile = async () => {
  return (
    <div className='max-w-md mx-auto space-y-4'>
      <h2 className='h2-bold'>Profile</h2>
      <ProfileForm />
    </div>
  );
};

export default Profile;
