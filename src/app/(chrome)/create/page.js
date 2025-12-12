"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateCampaignModal from '../../../components/CreateCampaignModal';

export default function CreatePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Open modal on page load
    setIsModalOpen(true);
  }, []);

  const handleClose = (didNavigate) => {
    setIsModalOpen(false);
    // Only redirect to home if modal was dismissed (not if user selected an option)
    if (!didNavigate) {
      router.push('/');
    }
    // If didNavigate is true, the modal already handled navigation to /create/frame or /create/background
  };

  return (
    <CreateCampaignModal 
      isOpen={isModalOpen} 
      onClose={handleClose} 
    />
  );
}
