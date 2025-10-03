import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { tenantAPI } from '../services/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  tenant: null,
  loading: true,
  error: null,
  subdomain: null,
  isMultiTenant: false
};

// Action types
const TENANT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_TENANT: 'SET_TENANT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUBDOMAIN: 'SET_SUBDOMAIN'
};

// Reducer
const tenantReducer = (state, action) => {
  switch (action.type) {
    case TENANT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case TENANT_ACTIONS.SET_TENANT:
      return {
        ...state,
        tenant: action.payload,
        loading: false,
        error: null,
        isMultiTenant: !!action.payload
      };
    case TENANT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case TENANT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case TENANT_ACTIONS.SET_SUBDOMAIN:
      return {
        ...state,
        subdomain: action.payload
      };
    default:
      return state;
  }
};

// Create context
const TenantContext = createContext();

// Helper function to extract subdomain
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost or IP addresses, return null
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  
  // If there are more than 2 parts and it's not www, first part is subdomain
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  return null;
};

// Provider component
export const TenantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);

  // Extract subdomain on component mount
  useEffect(() => {
    const subdomain = getSubdomain();
    dispatch({ type: TENANT_ACTIONS.SET_SUBDOMAIN, payload: subdomain });
    
    // If we have a subdomain, fetch tenant info
    if (subdomain) {
      fetchTenantInfo();
    } else {
      dispatch({ type: TENANT_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Fetch tenant information
  const fetchTenantInfo = async () => {
    try {
      dispatch({ type: TENANT_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TENANT_ACTIONS.CLEAR_ERROR });

      const response = await tenantAPI.getTenantInfo();
      dispatch({
        type: TENANT_ACTIONS.SET_TENANT,
        payload: response.data.data
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load tenant information';
      dispatch({ type: TENANT_ACTIONS.SET_ERROR, payload: message });
      
      // Handle specific tenant errors
      if (error.response?.data?.code === 'TENANT_NOT_FOUND') {
        // Redirect to main domain or show tenant not found page
        console.error('Tenant not found for subdomain:', state.subdomain);
      }
    }
  };

  // Update tenant info
  const updateTenant = async (tenantData) => {
    try {
      const response = await tenantAPI.updateTenantSettings(tenantData);
      dispatch({
        type: TENANT_ACTIONS.SET_TENANT,
        payload: response.data.data
      });
      toast.success('Tenant settings updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update tenant settings';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check if tenant has feature
  const hasFeature = (featureName) => {
    if (!state.tenant || !state.tenant.features) return false;
    return state.tenant.features[featureName] === true;
  };

  // Check usage limits
  const checkLimit = async (action, quantity = 1) => {
    try {
      const response = await tenantAPI.checkLimit({ action, quantity });
      return response.data.data;
    } catch (error) {
      console.error('Failed to check limit:', error);
      return { canPerform: false, message: 'Failed to check limit' };
    }
  };

  // Get tenant URL
  const getTenantUrl = (path = '') => {
    if (!state.tenant) return path;
    const protocol = window.location.protocol;
    const domain = process.env.REACT_APP_DOMAIN || 'mycrm.com';
    return `${protocol}//${state.tenant.subdomain}.${domain}${path}`;
  };

  // Check if current URL matches tenant
  const isValidTenantUrl = () => {
    if (!state.tenant) return true;
    const currentSubdomain = getSubdomain();
    return currentSubdomain === state.tenant.subdomain;
  };

  // Get plan features
  const getPlanFeatures = () => {
    if (!state.tenant) return {};
    
    const planFeatures = {
      trial: {
        maxUsers: 5,
        maxStorage: 1000, // 1GB
        customBranding: false,
        apiAccess: false,
        advancedReporting: false,
        integrations: false
      },
      starter: {
        maxUsers: 10,
        maxStorage: 5000, // 5GB
        customBranding: false,
        apiAccess: false,
        advancedReporting: false,
        integrations: true
      },
      professional: {
        maxUsers: 50,
        maxStorage: 20000, // 20GB
        customBranding: true,
        apiAccess: true,
        advancedReporting: true,
        integrations: true
      },
      enterprise: {
        maxUsers: 1000,
        maxStorage: 100000, // 100GB
        customBranding: true,
        apiAccess: true,
        advancedReporting: true,
        integrations: true
      }
    };

    return planFeatures[state.tenant.plan] || planFeatures.trial;
  };

  const value = {
    ...state,
    fetchTenantInfo,
    updateTenant,
    hasFeature,
    checkLimit,
    getTenantUrl,
    isValidTenantUrl,
    getPlanFeatures,
    subdomain: state.subdomain
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook to use tenant context
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;




