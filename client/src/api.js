import { buildWebpFileName, convertFileToWebp } from './utils/imageUpload';

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
export const API_URL = rawApiUrl.replace(/\/$/, '');

export const fetchMembers = async () => {
    try {
        const response = await fetch(`${API_URL}/public/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        return await response.json();
    } catch (error) {
        console.error("Error fetching members:", error);
        return [];
    }
};

export const fetchEvents = async () => {
    try {
        // Events are currently routed under orders in the backend
        const response = await fetch(`${API_URL}/orders/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

export const fetchDiscography = async () => {
    try {
        const response = await fetch(`${API_URL}/public/discography`);
        if (!response.ok) throw new Error('Failed to fetch discography');
        return await response.json();
    } catch (error) {
        console.error("Error fetching discography:", error);
        return [];
    }
};

export const fetchSettings = async () => {
    try {
        const response = await fetch(`${API_URL}/orders/settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        return await response.json();
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create order');
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const fetchOrders = async () => {
    try {
        const response = await fetch(`${API_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};

export const updateOrderStatus = async (id, status) => {
    try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update order status');
        return await response.json();
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

export const createMember = async (memberData) => {
    try {
        const response = await fetch(`${API_URL}/public/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData),
        });
        if (!response.ok) throw new Error('Failed to create member');
        return await response.json();
    } catch (error) {
        console.error('Error creating member:', error);
        throw error;
    }
};

export const updateMember = async (id, memberData) => {
    try {
        const response = await fetch(`${API_URL}/public/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData),
        });
        if (!response.ok) throw new Error('Failed to update member');
        return await response.json();
    } catch (error) {
        console.error('Error updating member:', error);
        throw error;
    }
};

export const deleteMember = async (id) => {
    try {
        const response = await fetch(`${API_URL}/public/members/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete member');
        return await response.json();
    } catch (error) {
        console.error('Error deleting member:', error);
        throw error;
    }
};

export const uploadMemberPhoto = async (file) => {
    try {
        const webpBlob = await convertFileToWebp(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82
        });

        const formData = new FormData();
        formData.append('photo', webpBlob, buildWebpFileName(file?.name || 'member-photo', 'member-photo'));
        const response = await fetch(`${API_URL}/public/members/upload-photo`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload photo');
        return await response.json();
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
    }
};
