import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Upload, 
  CheckCircle2, 
  ArrowLeft, 
  Trophy, 
  Phone, 
  Mail, 
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PublicPlayerRegistration = () => {
  const { slug } = useParams();
  const { activeTournament, registerPlayer, loadPublicTournament } = useAuction();
  const targetSlug = slug || activeTournament?.slug || import.meta.env.VITE_PUBLIC_AUCTION_SLUG || 'cpl-2026';
  useEffect(() => {
    loadPublicTournament(slug || null).catch(() => {});
  }, [slug, loadPublicTournament]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    age: '',
    city: 'Colombo',
    role: 'TOP_ORDER_BATTER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'Right-arm medium',
    experienceLevel: 'Domestic Club',
    matches: '',
    runs: '',
    wickets: '',
    highestScore: '',
    bestBowling: '',
    photoPreview: null
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        age: Number(formData.age) || 22,
        city: formData.city,
        role: formData.role,
        battingStyle: formData.battingStyle,
        bowlingStyle: formData.bowlingStyle,
        experienceLevel: formData.experienceLevel,
        photoUrl: formData.photoPreview || '',
        stats: {
          matches: Number(formData.matches) || 0,
          runs: Number(formData.runs) || 0,
          wickets: Number(formData.wickets) || 0,
          highestScore: formData.highestScore || '0',
          bestBowling: formData.bestBowling || '-'
        }
      };

      await registerPlayer(payload, targetSlug);
      setIsSubmitted(true);
    } catch (err) {
      console.error('[Registration Form] Error:', err);
      setErrorMessage(err.message || 'Could not submit registration. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-brand-emerald/40 shadow-glow-emerald/30">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-brand-emerald mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Submitted!</h2>
          <p className="text-sm text-slate-300 mt-2">
            Your player profile for <strong>{activeTournament?.title || 'the selected tournament'}</strong> has been registered. The tournament committee will review your statistics and assign your auction category.
          </p>
          <div className="p-4 bg-surface-accent rounded-xl border border-border-subtle my-6 text-left text-xs space-y-1">
            <p><span className="text-slate-400">Player:</span> <strong className="text-white">{formData.fullName}</strong></p>
            <p><span className="text-slate-400">Contact:</span> <strong className="text-white">{formData.contactNumber}</strong></p>
            <p><span className="text-slate-400">Status:</span> <span className="text-brand-gold font-bold">Pending Review</span></p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/">
              <Button variant="primary" className="w-full">
                Visit Live Auction Tracker
              </Button>
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-slate-400 hover:text-white mt-2"
            >
              Submit Another Registration
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Floor
        </Link>

        {/* Header Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-surface-card via-surface-accent to-surface-card border border-border-subtle p-6 sm:p-8 shadow-xl">
          <Badge variant="cyan" dot className="mb-3">
            OFFICIAL REGISTRATION PORTAL
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeTournament?.title || 'Loading tournament…'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fill in your authentic playing statistics and personal information to be drafted into the official player auction pool.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: PERSONAL INFORMATION */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-border-subtle pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" />
              1. Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Kusal Janith Perera"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />

              <Input
                label="WhatsApp / Mobile Number *"
                placeholder="+94 77 123 4567"
                required
                leftIcon={Phone}
                helperText="Acquisition alerts will be sent to this number"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              />

              <Input
                label="Official Email Address"
                placeholder="player@cricket.lk"
                type="email"
                leftIcon={Mail}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Age *"
                  placeholder="24"
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
                <Input
                  label="City / District"
                  placeholder="Colombo"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Profile Photo (Headshot)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl bg-slate-900 border border-border-subtle overflow-hidden flex items-center justify-center shrink-0 relative">
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <label className="flex-1 border-2 border-dashed border-border-subtle hover:border-brand-cyan rounded-xl p-4 text-center cursor-pointer transition-colors bg-canvas/40">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-brand-cyan font-bold block">Upload Portrait Photo</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, or WEBP up to 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
          </Card>

          {/* SECTION 2: CRICKET PROFILE */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-border-subtle pb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-emerald" />
              2. Cricket Profile & Playing Technique
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Primary Playing Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-cyan"
                >
                  <option value="TOP_ORDER_BATTER">Top-order Batter</option>
                  <option value="MIDDLE_ORDER_BATTER">Middle-order Batter</option>
                  <option value="WICKETKEEPER_BATTER">Wicketkeeper Batter</option>
                  <option value="PACE_ALL_ROUNDER">Pace All-rounder</option>
                  <option value="SPIN_ALL_ROUNDER">Spin All-rounder</option>
                  <option value="FAST_BOWLER">Fast Bowler</option>
                  <option value="SPIN_BOWLER">Spin Bowler</option>
                </select>
              </div>

              {/* Batting Style */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Batting Style *
                </label>
                <select
                  value={formData.battingStyle}
                  onChange={(e) => handleInputChange('battingStyle', e.target.value)}
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-cyan"
                >
                  <option value="RIGHT_HAND">Right-hand bat</option>
                  <option value="LEFT_HAND">Left-hand bat</option>
                </select>
              </div>

              {/* Bowling Style */}
              <Input
                label="Bowling Style"
                placeholder="e.g. Right-arm offbreak"
                value={formData.bowlingStyle}
                onChange={(e) => handleInputChange('bowlingStyle', e.target.value)}
              />

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Experience Tier *
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full bg-surface-card border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-cyan"
                >
                  <option value="International">International</option>
                  <option value="First Class">First Class</option>
                  <option value="Domestic Club">Domestic Club</option>
                  <option value="University">University</option>
                  <option value="School">School First XI</option>
                  <option value="Open">Open League</option>
                </select>
              </div>
            </div>
          </Card>

          {/* SECTION 3: CAREER STATISTICS */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-border-subtle pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              3. Recent Tournament Statistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Matches Played"
                placeholder="45"
                type="number"
                value={formData.matches}
                onChange={(e) => handleInputChange('matches', e.target.value)}
              />
              <Input
                label="Total Runs"
                placeholder="1250"
                type="number"
                value={formData.runs}
                onChange={(e) => handleInputChange('runs', e.target.value)}
              />
              <Input
                label="Total Wickets"
                placeholder="32"
                type="number"
                value={formData.wickets}
                onChange={(e) => handleInputChange('wickets', e.target.value)}
              />
              <Input
                label="Highest Score"
                placeholder="89*"
                value={formData.highestScore}
                onChange={(e) => handleInputChange('highestScore', e.target.value)}
              />
            </div>
          </Card>

          {/* Submission Action */}
          <Button
            type="submit"
            variant="primary"
            size="xl"
            isLoading={isSubmitting}
            className="w-full font-bold shadow-glow-cyan text-base"
          >
            Submit Player Registration Form
          </Button>
        </form>
      </div>
    </div>
  );
};
