export function useClerkAppearance() {
  return {
    layout: {
      logoPlacement: 'none' as const,
      socialButtonsVariant: 'blockButton' as const,
      socialButtonsPlacement: 'bottom' as const,
    },
    variables: {
      colorPrimary:            '#ec3586',
      colorBackground:         '#0f0f14',
      colorText:               '#ffffff',
      colorTextSecondary:      'rgba(255,255,255,0.45)',
      colorTextOnPrimaryBackground: '#ffffff',
      colorInputBackground:    '#07070a',
      colorInputText:          '#ffffff',
      colorNeutral:            '#ffffff',
      colorDanger:             '#ff4757',
      colorSuccess:            '#00d4aa',
      colorWarning:            '#ffaa00',
      colorShimmer:            'rgba(236,53,134,0.08)',
      borderRadius:            '12px',
      fontFamily:              'Space Grotesk, sans-serif',
      fontFamilyButtons:       'Space Grotesk, sans-serif',
      fontSize:                '14px',
      fontWeight:              { normal: 400, medium: 500, bold: 700 } as any,
      spacingUnit:             '16px',
    },
    elements: {
      // ── Card / root ─────────────────────────────────
      rootBox:                 'w-full',
      card:                    'bg-[#0f0f14] border border-white/[0.06] shadow-none rounded-2xl !p-8',
      cardBox:                 'shadow-none',

      // ── Header ──────────────────────────────────────
      headerTitle:             'text-white font-display font-bold tracking-tight',
      headerSubtitle:          'text-white/40 font-body text-sm',

      // ── Form fields ─────────────────────────────────
      formFieldInput:          'bg-[#07070a] border border-white/[0.07] text-white placeholder-white/25 rounded-xl font-body focus:border-[#ec3586]/50 focus:ring-0 transition-colors',
      formFieldLabel:          'text-white/50 text-xs font-display font-semibold tracking-[0.12em] uppercase',
      formFieldHintText:       'text-white/25 text-xs font-body',
      formFieldErrorText:      'text-[#ff4757] text-xs font-body',
      formFieldInputShowPasswordButton: 'text-white/30 hover:text-white/60',

      // ── Buttons ─────────────────────────────────────
      formButtonPrimary:       'bg-[#ec3586] hover:bg-[#d42e77] text-white font-display font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-none',
      formButtonReset:         'text-white/35 hover:text-white/60 font-body text-sm transition-colors',

      // ── Social buttons ───────────────────────────────
      socialButtonsBlockButton: 'border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white rounded-xl transition-all font-body font-medium',
      socialButtonsBlockButtonText: 'font-body font-medium text-sm',

      // ── Divider ─────────────────────────────────────
      dividerLine:             'bg-white/[0.06]',
      dividerText:             'text-white/25 text-xs font-body',

      // ── Links ────────────────────────────────────────
      footerActionLink:        'text-[#ec3586] hover:text-[#ec3586]/80 font-display font-semibold transition-colors',
      footerActionText:        'text-white/30 font-body text-sm',
      identityPreviewText:     'text-white/70 font-body text-sm',
      identityPreviewEditButton: 'text-[#ec3586] hover:text-[#ec3586]/80',

      // ── OTP / Code input ─────────────────────────────
      otpCodeFieldInput:       'bg-[#07070a] border border-white/[0.07] text-white rounded-xl font-display font-bold focus:border-[#ec3586]/60',

      // ── Alert ────────────────────────────────────────
      alert:                   'bg-[#ff4757]/8 border border-[#ff4757]/15 rounded-xl',
      alertText:               'text-[#ff4757] font-body text-sm',

      // ── Badge ────────────────────────────────────────
      badge:                   'bg-[#ec3586]/10 text-[#ec3586] font-display font-semibold text-xs rounded-full',

      // ── UserButton ───────────────────────────────────
      userButtonAvatarBox:     'rounded-full ring-1 ring-white/10',
      userButtonPopoverCard:   'bg-[#0f0f14] border border-white/[0.06] rounded-2xl shadow-lg',
      userButtonPopoverActionButton: 'text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl font-body transition-colors',
      userButtonPopoverActionButtonText: 'font-body text-sm',
      userButtonPopoverActionButtonIcon: 'text-white/30',
      userButtonPopoverFooter: 'border-t border-white/[0.05]',

      // ── Modal (UserProfile) ──────────────────────────
      modalContent:            'bg-[#0f0f14]',
      modalBackdrop:           'bg-black/70 backdrop-blur-sm',

      // ── UserProfile layout ────────────────────────────
      navbar:                  'bg-[#07070a] border-r border-white/[0.05]',
      navbarButton:            'text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg font-body transition-colors',
      navbarButtonActive:      'text-white bg-white/[0.06]',
      navbarButtonIcon:        'text-white/30',
      pageScrollBox:           'bg-[#0f0f14]',
      page:                    'bg-[#0f0f14]',

      // ── Profile sections ─────────────────────────────
      profileSection:                  'border-b border-white/[0.04]',
      profileSectionTitle:             'text-white/40 text-xs font-display font-semibold tracking-[0.14em] uppercase',
      profileSectionContent:           'text-white/80 font-body',
      profileSectionPrimaryButton:     'text-[#ec3586] hover:text-[#ec3586]/80 font-display font-semibold text-sm transition-colors',
      profileSectionItemList:          'border-white/[0.04]',

      // ── User preview (top of UserProfile) ────────────
      userPreview:                     'border-b border-white/[0.04]',
      userPreviewMainIdentifier:       'text-white font-display font-semibold',
      userPreviewSecondaryIdentifier:  'text-white/35 font-body text-sm',

      // ── Action buttons inside UserProfile ────────────
      accordionTriggerButton:          'text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors',
      accordionContent:                'bg-[#07070a]/50',

      // ── Danger zone ──────────────────────────────────
      profileSectionDangerButton:      'border border-[#ff4757]/20 text-[#ff4757] hover:bg-[#ff4757]/8 rounded-xl font-display font-semibold text-sm transition-colors',
    },
  }
}
