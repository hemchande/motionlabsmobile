/**
 * Example: Mobile Team Roster with API Integration
 * This demonstrates how to fetch and display data from the backend
 */

import { useEffect, useState } from 'react';
import { Bell, Plus, Search, ChevronRight, Users, Camera, Settings } from 'lucide-react';
import { athletesApi, Athlete } from '../../services/api';
import { useApi } from '../../hooks/useApi';

export function MobileTeamRosterWithAPI() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the useApi hook to fetch athletes
  const { data: athletes, loading, error, execute: fetchAthletes } = useApi(athletesApi.getAthletes);

  // Fetch athletes on component mount
  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // Filter athletes based on search query
  const filteredAthletes = athletes?.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Count athletes by status
  const statusCounts = {
    all: athletes?.length || 0,
    alert: athletes?.filter(a => a.status === 'alert').length || 0,
    monitor: athletes?.filter(a => a.status === 'monitor').length || 0,
    normal: athletes?.filter(a => a.status === 'normal').length || 0,
  };

  const getStatusColor = (status: Athlete['status']) => {
    switch (status) {
      case 'alert':
        return 'border-red-300 bg-red-50';
      case 'monitor':
        return 'border-yellow-300 bg-yellow-50';
      case 'normal':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusIndicator = (status: Athlete['status']) => {
    switch (status) {
      case 'alert':
        return 'bg-red-500';
      case 'monitor':
        return 'bg-yellow-500';
      case 'normal':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl text-gray-900">Team Roster</h1>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search athletes..."
            className="w-full h-10 border border-gray-300 rounded-lg pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Stats Pills */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          <div className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
            All ({statusCounts.all})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm">
            Alert ({statusCounts.alert})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-sm">
            Monitor ({statusCounts.monitor})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm">
            Normal ({statusCounts.normal})
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading athletes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 text-sm mb-2">{error.message}</p>
            <button
              onClick={() => fetchAthletes()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Athlete Cards - Scrollable */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No athletes found' : 'No athletes in roster'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className={`bg-white border-2 rounded-2xl p-4 active:opacity-80 ${getStatusColor(athlete.status)}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900 font-medium truncate">{athlete.name}</p>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusIndicator(athlete.status)}`} />
                      </div>
                      <p className="text-gray-600 text-sm">
                        {athlete.age} • {athlete.events.join('/')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  
                  {/* Alert/Monitor Message */}
                  {athlete.status !== 'normal' && athlete.metrics && (
                    <div className={`rounded-lg px-3 py-2 ${
                      athlete.status === 'alert' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}>
                      <p className={`text-xs ${
                        athlete.status === 'alert' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {athlete.status === 'alert' && athlete.metrics.kneeValgus && (
                          `Knee valgus: ↑${athlete.metrics.kneeValgus}° (+50% from baseline)`
                        )}
                        {athlete.status === 'monitor' && (
                          'Hip flexion: slight decrease'
                        )}
                      </p>
                    </div>
                  )}
                  
                  {athlete.status === 'normal' && (
                    <p className="text-blue-600 text-xs mt-2">All metrics normal</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Padding for Tab Bar */}
          <div className="h-20" />
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center py-2 text-blue-600">
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Roster</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}





