import React, { useState, useEffect } from 'react'
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Copy, ExternalLink,
  History, BarChart3, Settings, Info, Zap, Globe, Lock, Clock, Users,
  TrendingUp, ShieldCheck, AlertCircle, FileText, Download, Upload
} from 'lucide-react'

// Components
import UrlScanner from './components/UrlScanner'
import ScanResults from './components/ScanResults'
import UrlHistory from './components/UrlHistory'
import Analytics from './components/Analytics'
import SettingsPanel from './components/SettingsPanel'
import BatchScanner from './components/BatchScanner'
import Header from './components/Header'
import Footer from './components/Footer'

// Hooks
import { useUrlHistory } from './hooks/useUrlHistory'
import { useAnalytics } from './hooks/useAnalytics'

// Utils
import { analyzeUrl } from './utils/urlAnalyzer'
import { saveToLocalStorage, loadFromLocalStorage } from './utils/storage'

function App() {
  const [activeTab, setActiveTab] = useState('scanner')
  const [scanResults, setScanResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState(loadFromLocalStorage('settings', {
    autoSave: true,
    notifications: true,
    theme: 'cyberpunk',
    scanDepth: 'standard'
  }))

  const { urlHistory, addToHistory, clearHistory } = useUrlHistory()
  const { analytics, updateAnalytics } = useAnalytics()

  // Save settings to localStorage when changed
  useEffect(() => {
    saveToLocalStorage('settings', settings)
  }, [settings])

  const handleUrlScan = async (url) => {
    if (!url.trim()) return

    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const analysisResult = analyzeUrl(url)
      const resultWithTimestamp = {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      }

      setScanResults(prev => [resultWithTimestamp, ...prev.slice(0, 9)]) // Keep last 10 results
      addToHistory(resultWithTimestamp)
      updateAnalytics(analysisResult)

      if (settings.notifications) {
        showNotification(analysisResult.safe ? 'Safe URL detected' : 'Potential threat detected', analysisResult.safe ? 'success' : 'warning')
      }
    } catch (error) {
      console.error('Scan error:', error)
      showNotification('Failed to analyze URL', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchScan = async (urls) => {
    setIsLoading(true)
    const results = []

    for (const url of urls) {
      try {
        const result = analyzeUrl(url)
        const resultWithTimestamp = {
          ...result,
          timestamp: new Date().toISOString(),
          id: Date.now().toString() + Math.random()
        }
        results.push(resultWithTimestamp)
        addToHistory(resultWithTimestamp)
        updateAnalytics(result)
      } catch (error) {
        results.push({
          error: 'Failed to analyze',
          url,
          timestamp: new Date().toISOString(),
          id: Date.now().toString() + Math.random()
        })
      }
    }

    setScanResults(prev => [...results, ...prev])
    setIsLoading(false)
  }

  const showNotification = (message, type = 'info') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        icon: '/shield-check.svg',
        badge: '/shield-check.svg'
      })
    }
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const tabs = [
    { id: 'scanner', label: 'URL Scanner', icon: Shield, component: UrlScanner },
    { id: 'batch', label: 'Batch Scan', icon: Upload, component: BatchScanner },
    { id: 'history', label: 'History', icon: History, component: UrlHistory },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: Analytics },
    { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPanel }
  ]

  const CurrentComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen cyber-grid">
      <div className="relative z-10">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'cyber-btn text-green-400'
                      : 'bg-gray-800/50 text-gray-400 hover:text-gray-200 hover:bg-gray-800/70'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Main Content Area */}
          <div className="cyber-card rounded-2xl p-8">
            {CurrentComponent && (
              <CurrentComponent
                onScan={handleUrlScan}
                onBatchScan={handleBatchScan}
                scanResults={scanResults}
                isLoading={isLoading}
                urlHistory={urlHistory}
                clearHistory={clearHistory}
                analytics={analytics}
                settings={settings}
                setSettings={setSettings}
                requestNotificationPermission={requestNotificationPermission}
              />
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            <div className="cyber-card rounded-xl p-6 text-center">
              <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-200">{analytics.totalScans}</div>
              <div className="text-gray-400 text-sm">Total Scans</div>
            </div>
            
            <div className="cyber-card rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-200">{analytics.safeUrls}</div>
              <div className="text-gray-400 text-sm">Safe URLs</div>
            </div>
            
            <div className="cyber-card rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-200">{analytics.threatsDetected}</div>
              <div className="text-gray-400 text-sm">Threats Detected</div>
            </div>
            
            <div className="cyber-card rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-200">{analytics.accuracy}%</div>
              <div className="text-gray-400 text-sm">Accuracy</div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
