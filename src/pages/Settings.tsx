import { useState, useEffect } from 'react';
import { tradeService, tagService, userService, Tag, UserProfile } from '@/src/db';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useAuth } from '@/src/AuthContext';
import {
  Trash2, Plus, CheckCircle2, AlertCircle, Loader2, Tag as TagIcon,
} from 'lucide-react';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore',
  'Asia/Dubai', 'Australia/Sydney',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SGD', 'INR'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type TagCategory = 'SETUP' | 'MISTAKE' | 'EMOTION';

const CATEGORY_LABEL: Record<TagCategory, string> = {
  SETUP: 'Setups',
  MISTAKE: 'Mistakes',
  EMOTION: 'Emotions',
};

const CATEGORY_COLOR: Record<TagCategory, string> = {
  SETUP: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  MISTAKE: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  EMOTION: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

export function Settings() {
  const { user } = useAuth();

  // Profile
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState<Record<TagCategory, string>>({
    SETUP: '', MISTAKE: '', EMOTION: '',
  });
  const [addingTag, setAddingTag] = useState<TagCategory | null>(null);

  // Data management
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [clearStatus, setClearStatus] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle');

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(console.error);
    const unsub = tagService.subscribeToTags(setTags, console.error);
    return unsub;
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await userService.updateProfile(profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setSavingProfile(false);
    }
  }

  async function addTag(category: TagCategory) {
    const name = newTagName[category].trim();
    if (!name) return;
    if (tags.some((t) => t.type === category && t.name.toLowerCase() === name.toLowerCase())) return;
    setAddingTag(category);
    try {
      await tagService.addTag({ name, type: category });
      setNewTagName((prev) => ({ ...prev, [category]: '' }));
    } finally {
      setAddingTag(null);
    }
  }

  async function deleteTag(id: string) {
    await tagService.deleteTag(id);
  }

  async function handleLoadDemo() {
    setDemoStatus('loading');
    try {
      await tradeService.seedData();
      setDemoStatus('done');
      setTimeout(() => setDemoStatus('idle'), 3000);
    } catch {
      setDemoStatus('error');
      setTimeout(() => setDemoStatus('idle'), 3000);
    }
  }

  async function handleClearData() {
    setClearStatus('loading');
    try {
      await tradeService.clearAll();
      setClearStatus('done');
      setTimeout(() => setClearStatus('idle'), 3000);
    } catch {
      setClearStatus('idle');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input value={user?.email ?? ''} disabled className="text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={profile.displayName ?? user?.displayName ?? ''}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm">
              <span className="font-medium">Plan: </span>
              <span className={`font-semibold ${profile.subscriptionTier === 'PRO' ? 'text-primary' : 'text-muted-foreground'}`}>
                {profile.subscriptionTier ?? 'FREE'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Timezone</label>
              <select
                value={profile.timezone ?? 'UTC'}
                onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select
                value={profile.currency ?? 'USD'}
                onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Weekly Review Day</label>
            <select
              value={profile.weeklyReviewDay ?? 0}
              onChange={(e) => setProfile((p) => ({ ...p, weeklyReviewDay: Number(e.target.value) }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Day you prefer to review the previous week.</p>
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={saveProfile} disabled={savingProfile} size="sm">
              {savingProfile && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {profileSaved ? (
                <><CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" />Saved</>
              ) : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TagIcon className="h-4 w-4" />
            <span>Tag Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['SETUP', 'MISTAKE', 'EMOTION'] as TagCategory[]).map((cat) => {
            const categoryTags = tags.filter((t) => t.type === cat);
            return (
              <div key={cat}>
                <p className="text-sm font-semibold mb-3">{CATEGORY_LABEL[cat]}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categoryTags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLOR[cat]}`}
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => deleteTag(tag.id!)}
                        className="hover:opacity-70 transition-opacity ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {categoryTags.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No tags yet.</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    value={newTagName[cat]}
                    onChange={(e) => setNewTagName((p) => ({ ...p, [cat]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addTag(cat)}
                    placeholder={`Add ${CATEGORY_LABEL[cat].toLowerCase().slice(0, -1)} tag…`}
                    className="h-8 text-xs max-w-[220px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => addTag(cat)}
                    disabled={!newTagName[cat].trim() || addingTag === cat}
                  >
                    {addingTag === cat ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Load demo */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-sm font-medium">Load Demo Data</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Populate your journal with sample trades to explore the app.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {demoStatus === 'done' && (
                <span className="text-xs text-emerald-500 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /><span>Loaded</span>
                </span>
              )}
              {demoStatus === 'error' && (
                <span className="text-xs text-rose-500 flex items-center space-x-1">
                  <AlertCircle className="h-3.5 w-3.5" /><span>Error</span>
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDemo}
                disabled={demoStatus === 'loading'}
              >
                {demoStatus === 'loading' && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Load Demo Data
              </Button>
            </div>
          </div>

          {/* Clear data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-500">Clear All Data</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete all trades. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {clearStatus === 'done' && (
                <span className="text-xs text-emerald-500 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /><span>Cleared</span>
                </span>
              )}
              {clearStatus === 'idle' && (
                <Button variant="destructive" size="sm" onClick={() => setClearStatus('confirm')}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Clear Data
                </Button>
              )}
              {clearStatus === 'confirm' && (
                <>
                  <span className="text-xs text-rose-500 font-medium">Are you sure?</span>
                  <Button variant="outline" size="sm" onClick={() => setClearStatus('idle')}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearData}>
                    Yes, Delete
                  </Button>
                </>
              )}
              {clearStatus === 'loading' && (
                <Button variant="destructive" size="sm" disabled>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Deleting…
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
