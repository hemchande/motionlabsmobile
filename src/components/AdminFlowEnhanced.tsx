import {
  WireframeScreen,
  TopNavEnhanced,
  ButtonEnhanced,
  FormFieldEnhanced,
} from './EnhancedComponents';
import { Shield, Users, Database, Key, Activity, FileText, AlertTriangle, Download } from 'lucide-react';

export function AdminFlowEnhanced({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <AdminLoginSeparate key="admin-login" />,
    <AdminDashboard key="admin-dashboard" />,
    <UserManagement key="user-management" />,
    <SecuritySettings key="security-settings" />,
    <DataAccessControl key="data-access" />,
    <AuditLogs key="audit-logs" />,
    <SystemHealth key="system-health" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Separate Admin Login
function AdminLoginSeparate() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Separate secured admin entry point - isolated from coach/athlete/PT logins',
        kpis: ['Failed login attempts', 'Time to login', '2FA adoption rate', 'Session timeout rate'],
        dependencies: ['Admin auth service', '2FA/MFA system', 'IP whitelist', 'Session management']
      }}
    >
      <div className="flex items-center justify-center min-h-[600px] p-8 bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white mb-2">MotionLabs Admin Portal</h2>
            <p className="text-gray-400 text-sm">Secure administrative access</p>
          </div>

          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6">
            <FormFieldEnhanced label="Admin Email" placeholder="admin@motionlabs.com" required />
            <FormFieldEnhanced label="Password" type="password" placeholder="••••••••" required />
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                Two-Factor Authentication Code <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-12 h-12 border-2 border-gray-600 rounded-lg bg-gray-700 flex items-center justify-center text-white" />
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">Enter code from authenticator app</p>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                Trust this device for 30 days
              </label>
            </div>

            <ButtonEnhanced variant="danger" size="large">
              <Shield className="w-4 h-4 inline mr-2" />
              Secure Sign In
            </ButtonEnhanced>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>256-bit encryption • IP restricted • Session timeout: 30 min</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-500 text-xs">
              Admin access is logged and monitored. Unauthorized access attempts will be reported.
            </p>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 2: Admin Dashboard
function AdminDashboard() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Central admin hub with system overview and quick actions',
        kpis: ['Dashboard load time', 'Quick action usage', 'Alert response time', 'Time spent'],
        dependencies: ['System metrics aggregation', 'Real-time health monitoring', 'User activity logs']
      }}
    >
      <TopNavEnhanced 
        title="Admin Dashboard" 
        role="System Administrator"
        orgName="MotionLabs Platform"
        actions={
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-green-100 border border-green-300 rounded text-green-700 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              All Systems Operational
            </div>
          </div>
        }
      />
      <div className="p-6">
        {/* System Status Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-gray-600 text-sm">Total Users</p>
            </div>
            <p className="text-3xl text-gray-900 mb-1">248</p>
            <p className="text-xs text-gray-500">+12 this week</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-green-600" />
              <p className="text-gray-600 text-sm">Storage Used</p>
            </div>
            <p className="text-3xl text-gray-900 mb-1">2.4TB</p>
            <p className="text-xs text-gray-500">68% of quota</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <p className="text-gray-600 text-sm">Active Sessions</p>
            </div>
            <p className="text-3xl text-gray-900 mb-1">42</p>
            <p className="text-xs text-gray-500">Peak: 89 (3pm today)</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-gray-600 text-sm">Security Alerts</p>
            </div>
            <p className="text-3xl text-gray-900 mb-1">0</p>
            <p className="text-xs text-green-600">All clear</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-3 gap-4">
            <button className="border-2 border-gray-300 rounded-lg p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-gray-900 text-sm mb-1">Manage Users</p>
              <p className="text-gray-500 text-xs">Add, edit, or remove users</p>
            </button>
            <button className="border-2 border-gray-300 rounded-lg p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <Shield className="w-6 h-6 text-red-600 mb-2" />
              <p className="text-gray-900 text-sm mb-1">Security Settings</p>
              <p className="text-gray-500 text-xs">Configure access controls</p>
            </button>
            <button className="border-2 border-gray-300 rounded-lg p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <FileText className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-gray-900 text-sm mb-1">Audit Logs</p>
              <p className="text-gray-500 text-xs">View system activity</p>
            </button>
          </div>
        </div>

        {/* Organization Overview */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Organizations</h4>
          <div className="space-y-3">
            {[
              { name: 'Central High Gymnastics', users: 24, status: 'active', storage: '180GB' },
              { name: 'West Side Academy', users: 18, status: 'active', storage: '145GB' },
              { name: 'East Valley HS', users: 15, status: 'active', storage: '120GB' },
            ].map((org, i) => (
              <div key={i} className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white hover:border-gray-400 transition-colors">
                <div>
                  <p className="text-gray-900 mb-1">{org.name}</p>
                  <p className="text-gray-600 text-sm">{org.users} users • {org.storage} storage</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded">
                    {org.status}
                  </span>
                  <ButtonEnhanced variant="outline" size="small">
                    Manage
                  </ButtonEnhanced>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Security Events */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Security Events</h4>
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <div className="divide-y divide-gray-200">
              {[
                { event: 'New user account created', user: 'admin@motionlabs.com', time: '10 min ago', level: 'info' },
                { event: 'Password changed', user: 'coach@centralhs.edu', time: '2 hours ago', level: 'info' },
                { event: 'Failed login attempt (3x)', user: 'unknown@email.com', time: '5 hours ago', level: 'warning' },
                { event: 'Data export requested', user: 'pt@westsideacademy.org', time: '1 day ago', level: 'info' },
              ].map((event, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-gray-900 text-sm">{event.event}</p>
                      <p className="text-gray-500 text-xs">{event.user} • {event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 3: User Management
function UserManagement() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Comprehensive user account management with role assignment and permissions',
        kpis: ['User creation time', 'Role distribution', 'Deactivation rate', 'Time spent'],
        dependencies: ['User DB', 'Role permissions system', 'Email verification service']
      }}
    >
      <TopNavEnhanced 
        title="User Management" 
        role="System Administrator"
        orgName="MotionLabs Platform"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900 mb-1">User Accounts</h3>
            <p className="text-gray-600 text-sm">248 total users across all organizations</p>
          </div>
          <ButtonEnhanced variant="primary" size="medium">
            <Users className="w-4 h-4 inline mr-2" />
            Add New User
          </ButtonEnhanced>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">All Users</button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm">Coaches</button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm">Athletes</button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm">PT/AT</button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm">Admins</button>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {[
            { name: 'Mike Stevens', email: 'mike@centralhs.edu', role: 'Head Coach', org: 'Central HS', status: 'active', lastLogin: '2 hours ago' },
            { name: 'Sarah Lee', email: 'sarah@westsideacademy.org', role: 'Assistant Coach', org: 'West Side', status: 'active', lastLogin: '1 day ago' },
            { name: 'Dr. Emily Chen', email: 'echen@centralhs.edu', role: 'Athletic Trainer', org: 'Central HS', status: 'active', lastLogin: '30 min ago' },
            { name: 'Sarah Johnson', email: 'sarah.j@student.centralhs.edu', role: 'Athlete', org: 'Central HS', status: 'active', lastLogin: '3 hours ago' },
          ].map((user, i) => (
            <div key={i} className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div>
                  <p className="text-gray-900 mb-1">{user.name}</p>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{user.role}</span>
                    <span>•</span>
                    <span>{user.org}</span>
                    <span>•</span>
                    <span>Last login: {user.lastLogin}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded">{user.status}</span>
                <ButtonEnhanced variant="outline" size="small">Edit</ButtonEnhanced>
                <ButtonEnhanced variant="outline" size="small">Deactivate</ButtonEnhanced>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 4: Security Settings
function SecuritySettings() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'System-wide security configuration and access controls',
        kpis: ['Settings change frequency', '2FA enforcement rate', 'Password policy violations', 'Time spent'],
        dependencies: ['Auth configuration', 'IP whitelist DB', 'Session management', 'Encryption services']
      }}
    >
      <TopNavEnhanced 
        title="Security Settings" 
        role="System Administrator"
        orgName="MotionLabs Platform"
      />
      <div className="p-6">
        <h3 className="text-gray-900 mb-6">Security & Access Control</h3>

        {/* Authentication Settings */}
        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">Authentication Settings</h4>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 mt-0.5" defaultChecked />
              <div>
                <p className="text-gray-900 text-sm mb-1">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-gray-600 text-xs">Require all users to use 2FA for login</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 mt-0.5" defaultChecked />
              <div>
                <p className="text-gray-900 text-sm mb-1">Strong Password Requirements</p>
                <p className="text-gray-600 text-xs">Min 12 characters, upper/lower/number/special</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 mt-0.5" defaultChecked />
              <div>
                <p className="text-gray-900 text-sm mb-1">Password Expiration</p>
                <p className="text-gray-600 text-xs">Require password change every 90 days</p>
              </div>
            </label>
          </div>
        </div>

        {/* Session Settings */}
        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">Session Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <p className="text-gray-700 text-sm mb-3">Session Timeout</p>
              <select className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white px-3 text-sm">
                <option>15 minutes</option>
                <option selected>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <p className="text-gray-700 text-sm mb-3">Max Failed Login Attempts</p>
              <select className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white px-3 text-sm">
                <option>3</option>
                <option selected>5</option>
                <option>10</option>
              </select>
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">IP Whitelist (Admin Access)</h4>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-900">192.168.1.0/24</span>
                <span className="text-gray-500">Office Network</span>
                <button className="text-red-600 hover:text-red-800">Remove</button>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-900">10.0.0.0/8</span>
                <span className="text-gray-500">VPN Range</span>
                <button className="text-red-600 hover:text-red-800">Remove</button>
              </div>
            </div>
          </div>
          <ButtonEnhanced variant="outline" size="small">
            Add IP Range
          </ButtonEnhanced>
        </div>

        {/* Data Encryption */}
        <div>
          <h4 className="text-gray-900 mb-4">Data Encryption & Security</h4>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-blue-700" />
              <p className="text-blue-900"><strong>Encryption Status:</strong> Active</p>
            </div>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Data at rest: AES-256 encryption</li>
              <li>• Data in transit: TLS 1.3</li>
              <li>• Video storage: Encrypted with organization-specific keys</li>
              <li>• Database: Transparent Data Encryption (TDE) enabled</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <ButtonEnhanced variant="primary" size="medium">
            Save Security Settings
          </ButtonEnhanced>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 5: Data Access Control
function DataAccessControl() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Granular data access permissions and privacy controls',
        kpis: ['Permission changes', 'Data export requests', 'Access violations', 'Time spent'],
        dependencies: ['Permission matrix DB', 'Data export service', 'Access logs']
      }}
    >
      <TopNavEnhanced 
        title="Data Access Control" 
        role="System Administrator"
        orgName="MotionLabs Platform"
      />
      <div className="p-6">
        <h3 className="text-gray-900 mb-6">Data Access & Privacy Controls</h3>

        {/* Role Permissions Matrix */}
        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">Role Permissions Matrix</h4>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 text-gray-700">Permission</th>
                  <th className="text-center p-3 text-gray-700">Coach</th>
                  <th className="text-center p-3 text-gray-700">Athlete</th>
                  <th className="text-center p-3 text-gray-700">PT/AT</th>
                  <th className="text-center p-3 text-gray-700">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { perm: 'View athlete metrics', coach: true, athlete: true, ptat: true, admin: true },
                  { perm: 'Edit athlete data', coach: true, athlete: false, ptat: false, admin: true },
                  { perm: 'Upload videos', coach: true, athlete: false, ptat: false, admin: true },
                  { perm: 'View all organizations', coach: false, athlete: false, ptat: false, admin: true },
                  { perm: 'Export data', coach: true, athlete: false, ptat: true, admin: true },
                  { perm: 'Delete athlete records', coach: false, athlete: false, ptat: false, admin: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-900">{row.perm}</td>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={row.coach} className="w-4 h-4" />
                    </td>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={row.athlete} className="w-4 h-4" />
                    </td>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={row.ptat} className="w-4 h-4" />
                    </td>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={row.admin} className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Retention Policies */}
        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">Data Retention Policies</h4>
          <div className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-900 text-sm">Video Clips</p>
                <select className="h-8 border-2 border-gray-300 rounded px-2 text-sm">
                  <option>30 days</option>
                  <option selected>90 days</option>
                  <option>180 days</option>
                  <option>1 year</option>
                </select>
              </div>
              <p className="text-gray-600 text-xs">Automatic deletion after retention period</p>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-900 text-sm">Athlete Metrics Data</p>
                <select className="h-8 border-2 border-gray-300 rounded px-2 text-sm">
                  <option>1 year</option>
                  <option selected>2 years</option>
                  <option>5 years</option>
                  <option>Indefinite</option>
                </select>
              </div>
              <p className="text-gray-600 text-xs">Retained for longitudinal analysis</p>
            </div>
          </div>
        </div>

        <ButtonEnhanced variant="primary" size="medium">
          Save Access Controls
        </ButtonEnhanced>
      </div>
    </WireframeScreen>
  );
}

// Screen 6: Audit Logs
function AuditLogs() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Comprehensive audit trail of all system actions and security events',
        kpis: ['Log query time', 'Export frequency', 'Security event count', 'Time spent'],
        dependencies: ['Audit log DB', 'Log search/filter', 'Export service', 'Real-time logging']
      }}
    >
      <TopNavEnhanced 
        title="Audit Logs" 
        role="System Administrator"
        orgName="MotionLabs Platform"
        actions={
          <ButtonEnhanced variant="outline" size="small">
            <Download className="w-4 h-4 inline mr-1" /> Export Logs
          </ButtonEnhanced>
        }
      />
      <div className="p-6">
        <h3 className="text-gray-900 mb-6">System Audit Logs</h3>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <FormFieldEnhanced label="Date Range" type="select" placeholder="Last 7 days" />
          <FormFieldEnhanced label="Event Type" type="select" placeholder="All events" />
          <FormFieldEnhanced label="User" placeholder="Search user..." />
          <FormFieldEnhanced label="Organization" type="select" placeholder="All orgs" />
        </div>

        {/* Audit Log Table */}
        <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 text-gray-700">Timestamp</th>
                  <th className="text-left p-3 text-gray-700">User</th>
                  <th className="text-left p-3 text-gray-700">Action</th>
                  <th className="text-left p-3 text-gray-700">Resource</th>
                  <th className="text-left p-3 text-gray-700">IP Address</th>
                  <th className="text-left p-3 text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { time: '2026-01-05 14:32:15', user: 'admin@motionlabs.com', action: 'User created', resource: 'sarah.j@student.centralhs.edu', ip: '192.168.1.100', status: 'success' },
                  { time: '2026-01-05 14:15:42', user: 'mike@centralhs.edu', action: 'Video uploaded', resource: 'practice_jan5.mp4', ip: '10.0.2.45', status: 'success' },
                  { time: '2026-01-05 13:58:03', user: 'unknown', action: 'Login attempt', resource: 'admin portal', ip: '203.0.113.42', status: 'failed' },
                  { time: '2026-01-05 13:45:22', user: 'echen@centralhs.edu', action: 'Data exported', resource: 'athlete metrics (Dec 2025)', ip: '192.168.1.105', status: 'success' },
                  { time: '2026-01-05 13:20:11', user: 'sarah@westsideacademy.org', action: 'Alert escalated', resource: 'Anna Martinez', ip: '10.0.2.67', status: 'success' },
                ].map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-900 font-mono text-xs">{log.time}</td>
                    <td className="p-3 text-gray-900">{log.user}</td>
                    <td className="p-3 text-gray-900">{log.action}</td>
                    <td className="p-3 text-gray-600">{log.resource}</td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{log.ip}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.status === 'success' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 7: System Health
function SystemHealth() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Real-time system health monitoring and performance metrics',
        kpis: ['System uptime', 'API response time', 'Error rate', 'Resource utilization', 'Time spent'],
        dependencies: ['Health monitoring service', 'Performance metrics API', 'Alert system']
      }}
    >
      <TopNavEnhanced 
        title="System Health" 
        role="System Administrator"
        orgName="MotionLabs Platform"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900">System Status & Performance</h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-300 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-800">All Systems Operational</span>
          </div>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { service: 'API Gateway', status: 'operational', uptime: '99.98%' },
            { service: 'Video Processing', status: 'operational', uptime: '99.95%' },
            { service: 'ML Inference Engine', status: 'operational', uptime: '99.92%' },
            { service: 'Database', status: 'operational', uptime: '100%' },
            { service: 'Authentication', status: 'operational', uptime: '100%' },
            { service: 'Storage Service', status: 'operational', uptime: '99.97%' },
          ].map((item, i) => (
            <div key={i} className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-900 text-sm">{item.service}</p>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <p className="text-green-700 text-xs">Uptime: {item.uptime}</p>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Avg API Response</p>
            <p className="text-3xl text-gray-900 mb-1">142ms</p>
            <p className="text-xs text-green-600">↓ 8% vs last week</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">CPU Usage</p>
            <p className="text-3xl text-gray-900 mb-1">42%</p>
            <p className="text-xs text-gray-500">Normal range</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Memory Usage</p>
            <p className="text-3xl text-gray-900 mb-1">68%</p>
            <p className="text-xs text-gray-500">Normal range</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">Error Rate</p>
            <p className="text-3xl text-gray-900 mb-1">0.02%</p>
            <p className="text-xs text-green-600">Well below threshold</p>
          </div>
        </div>

        {/* Recent Incidents */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Incidents (30 days)</h4>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white text-center">
            <p className="text-gray-500 text-sm">No incidents in the past 30 days</p>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}
