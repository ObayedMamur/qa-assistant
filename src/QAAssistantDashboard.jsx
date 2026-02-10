import React, { useState, useEffect } from 'react';
import {
    GitBranch,
    Settings,
    DownloadCloud,
    Save,
    CheckCircle2,
    AlertCircle,
    Lock,
    Zap,
    Github,
    RefreshCw,
    Search,
    X,
    ChevronRight,
    Terminal,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Mock Data ---
const AVAILABLE_PLUGINS = [
    { id: 1, name: 'Better Payment', slug: 'better-payment', version: '2.1.0' },
    { id: 2, name: 'Essential Addons for Elementor', slug: 'essential-addons-elementor', version: '5.8.1' },
    { id: 3, name: 'Essential Addons Pro', slug: 'essential-addons-elementor-pro', version: '5.8.0' },
    { id: 4, name: 'WooCommerce', slug: 'woocommerce', version: '8.5' },
    { id: 5, name: 'Elementor', slug: 'elementor', version: '3.19' },
];

const INITIAL_SELECTED = [
    { id: 1, name: 'Better Payment', slug: 'better-payment', currentBranch: 'master', status: 'stable' },
    { id: 2, name: 'Essential Addons for Elementor', slug: 'essential-addons-elementor', currentBranch: 'dev', status: 'ahead' },
    { id: 3, name: 'Essential Addons Pro', slug: 'essential-addons-elementor-pro', currentBranch: 'fix/79971', status: 'modified' },
];

// --- Reusable UI Components (Shadcn-style) ---

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
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${styles[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

const Button = ({ children, variant = "primary", size = "md", className = "", icon: Icon, ...props }) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none ring-offset-white";

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
        className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
        {...props}
    />
);

const Switch = ({ checked, onCheckedChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`
      peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50
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
        throw new Error(result.data.message || 'Unknown error occurred');
    }
    return result.data;
};

// --- Main Application Component ---

const QAAssistantDashboard = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [allPlugins, setAllPlugins] = useState([]);
    const [selectedPlugins, setSelectedPlugins] = useState([]);
    const [isCloning, setIsCloning] = useState(false);
    const [isLoadingPlugins, setIsLoadingPlugins] = useState(true);
    const [activeTab, setActiveTab] = useState('git');
    const [toasts, setToasts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const fetchPlugins = async () => {
        setIsLoadingPlugins(true);
        try {
            const data = await apiCall('qa_assistant_get_plugins');
            const plugins = data.plugins || [];
            setAllPlugins(plugins);
            setSelectedPlugins(plugins.filter(p => p.is_monitored));
        } catch (error) {
            addToast('Failed to fetch plugins: ' + error.message, 'error');
        } finally {
            setIsLoadingPlugins(false);
        }
    };

    useEffect(() => {
        fetchPlugins();
    }, []);

    const features = [
        { icon: RefreshCw, title: 'One-click branch switching', desc: 'Switch branches directly from admin bar' },
        { icon: CheckCircle2, title: 'Current branch indicator', desc: 'Always know which branch is active' },
        { icon: AlertCircle, title: 'Uncommitted changes', desc: 'Safety warnings before switching' },
        { icon: Lock, title: 'Force switch option', desc: 'Discard local changes when needed' },
    ];

    const handleToggleMonitor = async (slug, monitor) => {
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
            fetchPlugins(); // Refresh list
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setIsCloning(false);
        }
    };

    const handleAliasChange = (pluginId, newAlias) => {
        setSelectedPlugins(prev => prev.map(p =>
            p.id === pluginId ? { ...p, alias: newAlias } : p
        ));
    };

    const handleUpdateDisplay = async () => {
        try {
            // Prepare data for backend
            const pluginsData = selectedPlugins.map(p => ({
                slug: p.slug,
                alias: p.alias || '',
                is_monitored: true
            }));

            // Also include unmonitored plugins? 
            // The current backend logic expects a list of ALL plugins to determine monitoring status if we were sending everything.
            // But here `selectedPlugins` only contains monitored ones.
            // Wait, `save_display_settings` in Ajax.php rebuilds `qa_assistant_monitored_plugins` based on the input.
            // If I only send `selectedPlugins`, then any plugin NOT in this list implies "not monitored" IF I sent the full list.
            // BUT, `selectedPlugins` in state is just the filtered list. 
            // If `Ajax.php` *replaces* the option with what I send, I must send ALL monitored plugins. 
            // `selectedPlugins` contain all monitored plugins.
            // So if I send just `selectedPlugins`, `Ajax.php` will set `monitored_slugs` to just these. 
            // That is correct.

            await apiCall('qa_assistant_save_display_settings', { plugins: JSON.stringify(pluginsData) });
            addToast('Display settings updated successfully', 'success');
            fetchPlugins(); // Refresh to ensure sync
        } catch (error) {
            addToast('Failed to save settings: ' + error.message, 'error');
        }
    };

    const unmonitoredPlugins = allPlugins.filter(p => !p.is_monitored);
    const filteredUnmonitored = unmonitoredPlugins.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded shadow-lg border px-4 py-3 bg-white ${toast.type === 'error' ? 'border-l-4 border-l-red-500' :
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
                    <Button variant="outline" size="sm" icon={Terminal}>Logs</Button>
                    <Button variant="primary" size="sm" icon={Save}>Save Settings</Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-1">
                    {['general', 'git', 'integrations', 'advanced'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab === 'git' && <GitBranch className="w-4 h-4" />}
                            {tab === 'general' && <Settings className="w-4 h-4" />}
                            {tab === 'integrations' && <Zap className="w-4 h-4" />}
                            {tab === 'advanced' && <Activity className="w-4 h-4" />}
                            <span className="capitalize">{tab} Settings</span>
                            {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </button>
                    ))}

                    <div className="mt-8 px-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System Status</h4>
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Git Daemon Active
                        </div>
                        <div className="text-xs text-slate-400 mt-1">v.2.4.0 • Memory: 32MB</div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Section: Repository Management */}
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
                                    <Github className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="https://github.com/username/repo.git"
                                        className="pl-9 !h-10 !py-2 !box-border w-full"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                    />
                                </div>
                                <Button
                                    disabled={!repoUrl || isCloning}
                                    onClick={handleClone}
                                    icon={DownloadCloud}
                                    isLoading={isCloning}
                                >
                                    {isCloning ? 'Cloning...' : 'Clone Repository'}
                                </Button>
                            </div>

                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-md border border-slate-200 shadow-sm flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-900 leading-none">Authentication Required</h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-snug">Ensure your server's SSH keys are added to your GitHub account or use a Personal Access Token in the URL.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section: Git Branch Display Configuration */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Git Branch Indicators</CardTitle>
                                    <CardDescription>Configure which plugins display branch info in the Admin Bar.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* Plugin Selection Input */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-700">Select Plugins to Monitor</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search installed plugins..."
                                        className="pl-9 !h-10 !py-2 !box-border w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {filteredUnmonitored.length > 0 && (
                                        <Badge
                                            variant="outline"
                                            className="cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                            onClick={() => filteredUnmonitored.forEach(p => handleToggleMonitor(p.slug, true))}
                                        >
                                            + Add All
                                        </Badge>
                                    )}
                                    {filteredUnmonitored.length === 0 && unmonitoredPlugins.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">All detected git plugins are being monitored.</span>
                                    )}
                                    {filteredUnmonitored.map(p => (
                                        <Badge
                                            key={p.id}
                                            variant="outline"
                                            className="opacity-60 border-dashed cursor-pointer hover:opacity-100 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            onClick={() => handleToggleMonitor(p.slug, true)}
                                        >
                                            + {p.name}
                                        </Badge>
                                    ))}
                                </div>
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
                                                                className="!h-7 !py-1 !text-xs w-32"
                                                                placeholder="Display Name"
                                                                value={plugin.alias || ''}
                                                                onChange={(e) => handleAliasChange(plugin.id, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className={`hidden md:flex flex-col items-end`}>
                                                        <span className={`text-sm font-bold capitalize mb-0.5 ${plugin.status === 'ahead' ? 'text-amber-500' :
                                                            plugin.status === 'modified' ? 'text-blue-600' : 'text-emerald-600'
                                                            }`}>
                                                            {plugin.status === 'stable' ? 'Stable' :
                                                                plugin.status === 'ahead' ? 'Ahead' :
                                                                    'Modified'}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-medium">Last fetch: 2m ago</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 -mr-2"
                                                        onClick={() => handleToggleMonitor(plugin.slug, false)}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </CardContent>

                        <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                                Changes to display settings are applied immediately.
                            </p>
                            <Button size="sm" onClick={handleUpdateDisplay}>Update Display</Button>
                        </CardFooter>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default QAAssistantDashboard;
