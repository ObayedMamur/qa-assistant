import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    GitBranch,
    Settings,
    DownloadCloud,
    CheckCircle2,
    AlertCircle,
    Lock,
    Zap,
    Github,
    Search,
    X,
    ChevronRight,
    Terminal,
    Activity,
    Clock,
    ArrowDownToLine,
    GitCommitHorizontal,
    RotateCcw,
    Trash2,
    Shield,
    Bell,
    Monitor,
    Eye,
    EyeOff,
    Cpu,
    HardDrive,
    Layers,
    ExternalLink,
    Webhook,
    MessageSquare,
    Box,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable UI Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ children, className = "" }) => (
    <div className={`p-6 pb-2 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight text-slate-900 ${className}`}>
        {children}
    </h3>
);

const CardDescription = ({ children, className = "" }) => (
    <p className={`text-sm text-slate-500 mt-2 ${className}`}>
        {children}
    </p>
);

const CardContent = ({ children, className = "" }) => (
    <div className={`p-6 pt-2 ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = "" }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge = ({ children, variant = "default", className = "", ...props }) => {
    const styles = {
        default: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
        success: "bg-emerald-100 text-emerald-700 border-emerald-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        outline: "border border-slate-200 text-slate-900 hover:bg-slate-100",
        info: "bg-blue-50 text-blue-700 border-blue-200",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${styles[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

const Button = ({ children, variant = "primary", size = "md", className = "", icon: Icon, ...props }) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ring-offset-white";

    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-900/90",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        outline: "border border-slate-200 hover:bg-slate-100 hover:text-slate-900",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-500 text-white hover:bg-red-600",
    };

    const sizes = {
        sm: "h-9 px-3",
        md: "h-10 py-2 px-4",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {children}
        </button>
    );
};

const Input = (props) => (
    <input
        className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
        {...props}
    />
);

const Switch = ({ checked, onCheckedChange, disabled = false }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`
      peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
      ${checked ? 'bg-slate-900' : 'bg-slate-200'}
    `}
    >
        <span
            className={`
        pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
        />
    </button>
);

// --- API Helper ---
const apiCall = async (action, data = {}, nonceType = 'nonce') => {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('nonce', window.qaAssistantData ? window.qaAssistantData[nonceType] : '');

    for (const key in data) {
        formData.append(key, data[key]);
    }

    const response = await fetch(window.qaAssistantData ? window.qaAssistantData.ajaxUrl : '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.data?.message || 'Unknown error occurred');
    }
    return result.data;
};

// --- Time Helpers ---
function timeAgo(timestamp) {
    if (!timestamp) return '';
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// --- Action Type Config ---
const ACTION_CONFIG = {
    pull: { icon: ArrowDownToLine, label: 'Pull', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    switch: { icon: GitBranch, label: 'Switch', color: 'text-blue-600', bg: 'bg-blue-50' },
    fetch: { icon: RefreshCw, label: 'Fetch', color: 'text-violet-600', bg: 'bg-violet-50' },
    stash: { icon: Box, label: 'Stash', color: 'text-amber-600', bg: 'bg-amber-50' },
    commit: { icon: GitCommitHorizontal, label: 'Commit', color: 'text-orange-600', bg: 'bg-orange-50' },
};

// =============================================
// TAB CONTENT COMPONENTS
// =============================================

// --- General Settings Tab ---
const GeneralSettingsTab = ({ addToast }) => {
    const [showInAdminBar, setShowInAdminBar] = useState(true);
    const [showBranchBadges, setShowBranchBadges] = useState(true);
    const [notifyOnPull, setNotifyOnPull] = useState(true);
    const [toastDuration, setToastDuration] = useState(4);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Display Preferences</CardTitle>
                    <CardDescription>
                        Customize how QA Assistant appears in your WordPress admin area.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Monitor className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Show in Admin Bar</label>
                                <p className="text-xs text-slate-500 mt-0.5">Display Git Branches button in the WordPress admin bar</p>
                            </div>
                        </div>
                        <Switch checked={showInAdminBar} onCheckedChange={setShowInAdminBar} />
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Eye className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Branch Badges in Admin Bar</label>
                                <p className="text-xs text-slate-500 mt-0.5">Show colored branch badges next to plugin names</p>
                            </div>
                        </div>
                        <Switch checked={showBranchBadges} onCheckedChange={setShowBranchBadges} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                        Control when and how you receive notifications about git operations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Bell className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Pull Notifications</label>
                                <p className="text-xs text-slate-500 mt-0.5">Show toast notifications after pull operations</p>
                            </div>
                        </div>
                        <Switch checked={notifyOnPull} onCheckedChange={setNotifyOnPull} />
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Toast Duration</label>
                                <p className="text-xs text-slate-500 mt-0.5">How long notifications stay visible (seconds)</p>
                            </div>
                        </div>
                        <select
                            value={toastDuration}
                            onChange={(e) => setToastDuration(Number(e.target.value))}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value={2}>2s</option>
                            <option value={3}>3s</option>
                            <option value={4}>4s</option>
                            <option value={5}>5s</option>
                            <option value={8}>8s</option>
                        </select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Integration Settings Tab ---
const IntegrationSettingsTab = () => {
    const integrations = [
        {
            name: 'GitHub Webhooks',
            description: 'Auto-pull when changes are pushed to GitHub',
            icon: Github,
            status: 'planned',
        },
        {
            name: 'Slack Notifications',
            description: 'Send deployment notifications to Slack channels',
            icon: MessageSquare,
            status: 'planned',
        },
        {
            name: 'Bitbucket',
            description: 'Connect Bitbucket repositories for branch management',
            icon: Layers,
            status: 'planned',
        },
        {
            name: 'GitLab',
            description: 'GitLab repository integration and CI/CD triggers',
            icon: GitBranch,
            status: 'planned',
        },
    ];

    return (
        <Card>
            <CardHeader className="border-b border-slate-100">
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                    Connect QA Assistant with external services to enhance your workflow.
                </CardDescription>
            </CardHeader>
            <CardContent className="!pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((integration) => (
                        <div
                            key={integration.name}
                            className="group relative border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all bg-slate-50/50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <integration.icon className="w-5 h-5 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-slate-900">{integration.name}</h4>
                                        <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0 text-slate-400 border-slate-200">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{integration.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Want an integration?</h4>
                            <p className="text-xs text-blue-700 mt-1">
                                These integrations are under active development. Check back for updates or submit a feature request.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// --- Advanced Settings Tab ---
const AdvancedSettingsTab = ({ addToast }) => {
    const [isClearing, setIsClearing] = useState(false);

    const handleClearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) return;
        setIsClearing(true);
        try {
            await apiCall('qa_assistant_clear_activity_logs');
            addToast('Activity logs cleared', 'success');
        } catch (error) {
            addToast('Failed to clear logs: ' + error.message, 'error');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Performance</CardTitle>
                    <CardDescription>
                        Fine-tune performance and caching behavior.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <HardDrive className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Branch Cache TTL</label>
                                <p className="text-xs text-slate-500 mt-0.5">How long to cache branch list data</p>
                            </div>
                        </div>
                        <select
                            defaultValue="0"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="0">No cache</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="900">15 minutes</option>
                        </select>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Activity className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Log Retention</label>
                                <p className="text-xs text-slate-500 mt-0.5">Maximum number of activity log entries to keep</p>
                            </div>
                        </div>
                        <select
                            defaultValue="100"
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="50">50 entries</option>
                            <option value="100">100 entries</option>
                            <option value="250">250 entries</option>
                            <option value="500">500 entries</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-red-200">
                <CardHeader className="border-b border-red-100">
                    <CardTitle className="!text-red-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Destructive actions that cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="!pt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-red-900">Clear Activity Logs</h4>
                            <p className="text-xs text-red-700 mt-0.5">Permanently delete all recorded git activity.</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            icon={Trash2}
                            onClick={handleClearLogs}
                            disabled={isClearing}
                        >
                            {isClearing ? 'Clearing...' : 'Clear Logs'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Activity Log Panel ---
const ActivityLogPanel = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiCall('qa_assistant_get_activity_logs');
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, fetchLogs]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <Card className="mb-6">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-slate-500" />
                                <h3 className="text-sm font-semibold text-slate-900">Activity Log</h3>
                                <Badge variant="outline" className="!text-[10px]">{logs.length} entries</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchLogs}
                                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                            {isLoading && logs.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">Loading logs…</div>
                            ) : logs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Terminal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No activity recorded yet.</p>
                                    <p className="text-xs text-slate-400 mt-1">Actions like pull, switch, fetch, stash, and commit will be logged here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {logs.map((log, idx) => {
                                        const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.pull;
                                        const ActionIcon = config.icon;
                                        return (
                                            <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                                <div className={`p-1.5 rounded-md ${config.bg}`}>
                                                    <ActionIcon className={`w-3.5 h-3.5 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-900">{config.label}</span>
                                                        <span className="text-xs text-slate-400">→</span>
                                                        <span className="text-xs font-mono text-slate-600 truncate">{log.repo}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-500">{log.message}</span>
                                                        {log.branch && (
                                                            <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0">
                                                                {log.branch}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                    <span className="text-[10px] text-slate-400">{timeAgo(log.timestamp)}</span>
                                                    {log.user && (
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <User className="w-2.5 h-2.5" /> {log.user}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- System Status Sidebar ---
const SystemStatusSidebar = () => {
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await apiCall('qa_assistant_get_system_status');
                setStatus(data);
            } catch (err) {
                console.error('Failed to fetch status:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="mt-8 px-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Status</h4>
                <div className="text-xs text-slate-400 animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!status) return null;

    const items = [
        { label: 'Git', value: `v${status.git_version}`, ok: status.git_version !== 'Not found' },
        { label: 'PHP', value: `v${status.php_version}` },
        { label: 'WP', value: `v${status.wp_version}` },
        { label: 'Plugin', value: `v${status.plugin_version}` },
        { label: 'Memory', value: `${status.memory_usage} / ${status.memory_limit}` },
        { label: 'Repos', value: status.monitored_repos },
        { label: 'OS', value: status.os },
    ];

    return (
        <div className="mt-8 px-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Status</h4>
            <div className="flex items-center gap-2 text-sm text-emerald-600 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-medium">Git Active</span>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{item.label}</span>
                        <span className={`font-mono ${item.ok === false ? 'text-red-500' : 'text-slate-700'}`}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =============================================
// MAIN APPLICATION COMPONENT
// =============================================

const QAAssistantDashboard = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [allPlugins, setAllPlugins] = useState([]);
    const [selectedPlugins, setSelectedPlugins] = useState([]);
    const [isCloning, setIsCloning] = useState(false);
    const [isLoadingPlugins, setIsLoadingPlugins] = useState(true);
    const [activeTab, setActiveTab] = useState('git');
    const [toasts, setToasts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [hasDisplayChanges, setHasDisplayChanges] = useState(false);
    const initialPluginsRef = useRef(null);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const fetchPlugins = useCallback(async () => {
        setIsLoadingPlugins(true);
        try {
            const data = await apiCall('qa_assistant_get_plugins');
            const plugins = data.plugins || [];
            setAllPlugins(plugins);
            const monitored = plugins.filter(p => p.is_monitored);
            setSelectedPlugins(monitored);
            initialPluginsRef.current = JSON.stringify(monitored.map(p => ({ slug: p.slug, alias: p.alias || '' })));
            setHasDisplayChanges(false);
        } catch (error) {
            addToast('Failed to fetch plugins: ' + error.message, 'error');
        } finally {
            setIsLoadingPlugins(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchPlugins();
    }, [fetchPlugins]);

    const handleToggleMonitor = async (slug, monitor) => {
        if (!monitor) {
            const plugin = selectedPlugins.find(p => p.slug === slug);
            const name = plugin ? plugin.name : slug;
            if (!window.confirm(`Remove "${name}" from monitoring?`)) return;
        }
        try {
            await apiCall('qa_assistant_toggle_monitor', { slug, monitor });
            addToast(monitor ? 'Plugin added to monitoring' : 'Plugin removed from monitoring', 'success');
            fetchPlugins();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleClone = async () => {
        if (!repoUrl) return;
        setIsCloning(true);

        try {
            await apiCall('qa_assistant_clone_repo', { repo_url: repoUrl }, 'clone_nonce');
            addToast('Repository cloned successfully!', 'success');
            setRepoUrl('');
            fetchPlugins();
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setIsCloning(false);
        }
    };

    const handleAliasChange = (pluginId, newAlias) => {
        setSelectedPlugins(prev => {
            const updated = prev.map(p =>
                p.id === pluginId ? { ...p, alias: newAlias } : p
            );
            const currentSnapshot = JSON.stringify(updated.map(p => ({ slug: p.slug, alias: p.alias || '' })));
            setHasDisplayChanges(currentSnapshot !== initialPluginsRef.current);
            return updated;
        });
    };

    const handleUpdateDisplay = async () => {
        try {
            const pluginsData = selectedPlugins.map(p => ({
                slug: p.slug,
                alias: p.alias || '',
                is_monitored: true
            }));

            await apiCall('qa_assistant_save_display_settings', { plugins: JSON.stringify(pluginsData) });
            addToast('Display settings updated successfully', 'success');
            fetchPlugins();
        } catch (error) {
            addToast('Failed to save settings: ' + error.message, 'error');
        }
    };

    const unmonitoredPlugins = allPlugins.filter(p => !p.is_monitored);
    const filteredUnmonitored = unmonitoredPlugins.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'general', label: 'General Settings', icon: Settings },
        { id: 'git', label: 'Git Settings', icon: GitBranch },
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'advanced', label: 'Advanced', icon: Activity },
    ];

    // --- Git Settings Content ---
    const renderGitSettings = () => (
        <div className="space-y-6">
            {/* Repository Connection */}
            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Repository Connection</CardTitle>
                    <CardDescription>
                        Clone a repository directly into your plugins directory using HTTPS or SSH.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                        <div className="relative flex-1 w-full">
                            <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="https://github.com/username/repo.git"
                                className="pl-9 !h-10 !py-2 !box-border w-full !bg-white"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                            />
                        </div>
                        <Button
                            disabled={!repoUrl || isCloning}
                            onClick={handleClone}
                            icon={DownloadCloud}
                        >
                            {isCloning ? 'Cloning...' : 'Clone Repository'}
                        </Button>
                    </div>

                    <div className="mt-4 p-3.5 bg-blue-50/60 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <span className="font-medium">Private repositories only:</span> Ensure your server's SSH keys are added to your GitHub account or include a Personal Access Token in the URL. Public repositories can be cloned without authentication.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Git Branch Indicators */}
            <Card>
                <CardHeader>
                    <CardTitle>Git Branch Indicators</CardTitle>
                    <CardDescription>Configure which plugins display branch info in the Admin Bar.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Plugin Search to Add */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Add Plugin to Monitor</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search installed plugins to add..."
                                className="pl-9 !h-10 !py-2 !box-border w-full !bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {searchTerm && filteredUnmonitored.length > 0 && (
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                                {filteredUnmonitored.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { handleToggleMonitor(p.slug, true); setSearchTerm(''); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
                                    >
                                        <GitBranch className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <span className="font-medium text-slate-900">{p.name}</span>
                                        <span className="text-xs text-slate-400 font-mono">{p.slug}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searchTerm && filteredUnmonitored.length === 0 && (
                            <p className="text-xs text-slate-400 italic px-1">No matching unmonitored plugins found.</p>
                        )}
                        {!searchTerm && unmonitoredPlugins.length === 0 && (
                            <p className="text-xs text-slate-400 italic px-1">All detected git plugins are being monitored.</p>
                        )}
                    </div>

                    {/* Active Plugin Cards */}
                    <div className="space-y-3 mt-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently Monitoring</h4>

                        {isLoadingPlugins ? (
                            <div className="p-8 text-center text-slate-500 text-sm">Loading repositories...</div>
                        ) : selectedPlugins.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                No plugins are currently being monitored. Add plugins from the list above.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {selectedPlugins.map((plugin) => (
                                    <div key={plugin.id} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors ${plugin.status === 'stable' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-100'
                                                }`}>
                                                <GitBranch className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900 leading-tight mb-1.5">{plugin.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600">
                                                        {plugin.slug}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className={`text-sm font-medium ${plugin.status === 'ahead' ? 'text-amber-500' :
                                                        plugin.status === 'modified' ? 'text-blue-600' : 'text-emerald-600'
                                                        }`}>
                                                        {plugin.currentBranch}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <label className="text-xs font-medium text-slate-500">Alias:</label>
                                                    <Input
                                                        className="!h-7 !py-1 !text-xs w-36 !bg-white !border-slate-300 !shadow-sm"
                                                        placeholder="Display Name"
                                                        value={plugin.alias || ''}
                                                        onChange={(e) => handleAliasChange(plugin.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className={`text-sm font-bold capitalize mb-0.5 ${plugin.status === 'ahead' ? 'text-amber-500' :
                                                    plugin.status === 'modified' ? 'text-blue-600' : 'text-emerald-600'
                                                    }`}>
                                                    {plugin.status === 'stable' ? 'Stable' :
                                                        plugin.status === 'ahead' ? 'Ahead' :
                                                            'Modified'}
                                                </span>
                                                {plugin.lastFetch && (
                                                    <span className="text-xs text-slate-400 font-medium">Last fetch: {timeAgo(plugin.lastFetch)}</span>
                                                )}
                                            </div>
                                            <button
                                                className="h-10 w-10 inline-flex items-center justify-center rounded-md cursor-pointer text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors -mr-2"
                                                onClick={() => handleToggleMonitor(plugin.slug, false)}
                                                title={`Remove ${plugin.name} from monitoring`}
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
                    <p className="text-xs text-slate-500">Update the admin bar display for the monitored plugins listed above.</p>
                    <Button size="sm" onClick={handleUpdateDisplay} disabled={!hasDisplayChanges}>Update Display</Button>
                </CardFooter>
            </Card>
        </div>
    );

    // --- Render active tab content ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettingsTab addToast={addToast} />;
            case 'git':
                return renderGitSettings();
            case 'integrations':
                return <IntegrationSettingsTab />;
            case 'advanced':
                return <AdvancedSettingsTab addToast={addToast} />;
            default:
                return renderGitSettings();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900">
            {/* Toast Container */}
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg shadow-lg border px-4 py-3 bg-white ${toast.type === 'error' ? 'border-l-4 border-l-red-500' :
                            toast.type === 'success' ? 'border-l-4 border-l-emerald-500' :
                                'border-l-4 border-l-blue-500'
                            }`}
                    >
                        <p className="text-sm font-medium text-slate-700">{toast.message}</p>
                        <button onClick={() => setToasts(t => t.filter(i => i.id !== toast.id))} className="ml-auto hover:bg-slate-100 rounded p-1 text-slate-400">
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Header Area */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">QA Assistant</h1>
                    <p className="text-slate-500">Manage your development environments and git workflows directly from WordPress.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant={showActivityLog ? 'primary' : 'outline'}
                        size="sm"
                        icon={Terminal}
                        onClick={() => setShowActivityLog(!showActivityLog)}
                    >
                        Activity
                        {showActivityLog ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Activity Log Panel */}
                <ActivityLogPanel
                    isOpen={showActivityLog}
                    onClose={() => setShowActivityLog(false)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                            </button>
                        ))}

                        {/* System Status */}
                        <SystemStatusSidebar />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QAAssistantDashboard;
