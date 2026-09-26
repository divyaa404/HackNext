import axios from 'axios';

const API_URL = `/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const createEvent = async (data: any) => {
  const response = await axios.post(`${API_URL}/events`, data, getAuthHeaders());
  return response.data;
};

export const getOrganizerEvents = async () => {
  const response = await axios.get(`${API_URL}/events/my-events`, getAuthHeaders());
  return response.data;
};

export const getEventDetails = async (id: string) => {
  const response = await axios.get(`${API_URL}/events/${id}/organizer-details`, getAuthHeaders());
  return response.data;
};
