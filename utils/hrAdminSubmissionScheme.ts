
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { submissionService } from '../services/submissionService';
import { supabase } from '../lib/supabase';
import { Submission, AuthUser } from '../types';

/**
 * HR_PAGE_SIZE is standardized to 25 items per page for all HR modules.
 */
export const HR_PAGE_SIZE = 25;

/**
 * useHRAdminSubmissionScheme
 * 
 * A blueprint hook for HR Admin submission modules (Libur Mandiri, Lembur, Izin, etc).
 * Implements:
 * 1. Pagination (Fixed at 25)
 * 2. Active Listening (Supabase Realtime)
 * 3. Finetuning Fetching (Search, Status, and Scope-aware fetching)
 * 
 * DESIGN STANDARDS:
 * - Layout: Always place the Pagination component in a SEPARATE Card at the very bottom.
 * - Spacing: Use 'mt-8' on the Pagination container and 'rounded-xl' for consistency.
 */
export const useHRAdminSubmissionScheme = (
  type: string, 
  user: AuthUser,
  initialStatus: string = 'Pending'
) => {
  const [data, setData] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  
  // Use ref to always have the latest fetchData in realtime callbacks without re-subscribing
  const fetchDataRef = useRef<Function>();

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      
      const { data: result, totalCount: count } = await submissionService.getByTypePaged(
        type,
        page,
        HR_PAGE_SIZE,
        statusFilter === 'SEMUA STATUS' ? 'ALL' : statusFilter,
        activeQuery
      );
      
      setData(result);
      setTotalCount(count);
    } catch (error) {
      console.error(`[Scheme] Error fetching ${type}:`, error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [type, page, statusFilter, activeQuery]);

  // Sync ref with current fetchData
  fetchDataRef.current = fetchData;

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Active Listening (Real-time Synchronization)
    // We create a dedicated channel for this submission type
    const channelName = `rt-hr-${type.replace(/\s+/g, '-').toLowerCase()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'account_submissions',
        // Optional: filter by type at database level if supported by your setup
        // filter: `type=eq.${type}` 
      }, (payload: any) => {
        // Only refresh if the change is relevant to our type
        // Note: For DELETE events, payload.old might only contain the ID.
        // In that case, we refresh to be safe (as deletions are rare compared to reads)
        const isDelete = payload.eventType === 'DELETE';
        const isTypeMatch = payload.new?.type === type || payload.old?.type === type;
        
        if (isDelete || isTypeMatch) {
          if (fetchDataRef.current) fetchDataRef.current(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, page, statusFilter, activeQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setActiveQuery(searchTerm);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setSearchTerm('');
    setActiveQuery('');
  };

  return {
    data,
    totalCount,
    isLoading,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    handleSearch,
    handleStatusChange,
    refresh: () => fetchData(true),
    pageSize: HR_PAGE_SIZE
  };
};
