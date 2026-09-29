import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { calculateEventLeaderboardWithProof } from '../utils/evaluation';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

// Generate SVG Certificate content locally with customizable coordinates & template background
function generateCertificateSvg(params: {
  certNo: string;
  recipientName: string;
  type: string;
  title: string;
  teamName?: string | null;
  eventName: string;
  issueDate: string;
  signatureHash: string;
  templateImageUrl?: string | null;
  config?: any;
}): string {
  const { certNo, recipientName, type, title, teamName, eventName, issueDate, signatureHash, templateImageUrl, config = {} } = params;

  const isWinner1 = type === 'WINNER_1';
  const isWinner2 = type === 'WINNER_2';
  const isWinner3 = type === 'WINNER_3';
  const isWinner = isWinner1 || isWinner2 || isWinner3;

  const primaryColor = config.primary_color || (isWinner1 ? '#eab308' : isWinner2 ? '#94a3b8' : isWinner3 ? '#d97706' : '#dc2626');
  const badgeTitle = config.badge_title || (isWinner1 ? '1ST PLACE WINNER' : isWinner2 ? '2ND PLACE WINNER' : isWinner3 ? '3RD PLACE WINNER' : (type === 'PARTICIPANT' ? 'OFFICIAL PARTICIPATION' : title.toUpperCase()));
  const subtitle = config.subtitle || (isWinner 
    ? `For securing ${title.toUpperCase()} at` 
    : 'For outstanding active participation and project development in');

  const nameX = Number(config.name_x ?? 600);
  const nameY = Number(config.name_y ?? 325);
  const nameFontSize = Number(config.name_font_size ?? 46);
  const nameColor = config.name_color || '#dc2626';
  const fontFamily = config.font_family || "'Inter', system-ui, -apple-system, sans-serif";
  
  // Map alignment to valid SVG text-anchor
  const rawAlign = String(config.text_align || 'middle').toLowerCase().trim();
  const textAnchor = (rawAlign === 'start' || rawAlign === 'left') ? 'start' : (rawAlign === 'end' || rawAlign === 'right') ? 'end' : 'middle';

  const hasCustomBg = templateImageUrl && templateImageUrl.trim().length > 0 && !templateImageUrl.includes('certificate-default.png');
  const gradId = `borderGrad_${certNo.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Resolve background image to standalone Base64 Data URI if stored locally in uploads
  let resolvedBgUri = templateImageUrl || '';
  if (hasCustomBg && templateImageUrl) {
    if (templateImageUrl.startsWith('/uploads/')) {
      const relPath = templateImageUrl.replace(/^\/uploads\//, '');
      const localFilePath = path.join(__dirname, '../../uploads', relPath);
      if (fs.existsSync(localFilePath)) {
        try {
          const ext = path.extname(localFilePath).toLowerCase().replace('.', '');
          const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : 'image/jpeg';
          const fileBase64 = fs.readFileSync(localFilePath).toString('base64');
          resolvedBgUri = `data:${mimeType};base64,${fileBase64}`;
        } catch (e) {
          console.error('Failed to read local background image file for SVG embed:', e);
        }
      }
    }
  }

  const underlineHalfWidth = Math.min(260, Math.max(120, nameFontSize * 4));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" style="background:#ffffff; font-family: ${fontFamily};">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="50%" stop-color="#18181b" />
        <stop offset="100%" stop-color="${primaryColor}" />
      </linearGradient>
    </defs>

    ${hasCustomBg ? `
      <!-- Uploaded Template Background (Embedded Base64 / URI) -->
      <image href="${resolvedBgUri}" x="0" y="0" width="1200" height="800" preserveAspectRatio="none" />
    ` : `
      <!-- Outer Decorative Border -->
      <rect x="20" y="20" width="1160" height="760" fill="#ffffff" stroke="#18181b" stroke-width="8"/>
      <rect x="35" y="35" width="1130" height="730" fill="#fafafa" stroke="url(#${gradId})" stroke-width="4"/>
      <rect x="45" y="45" width="1110" height="710" fill="#ffffff" stroke="#e4e4e7" stroke-width="2"/>

      <!-- Geometric Corner Accents -->
      <polygon points="20,20 100,20 20,100" fill="${primaryColor}" />
      <polygon points="1180,20 1100,20 1180,100" fill="${primaryColor}" />
      <polygon points="20,780 100,780 20,700" fill="#18181b" />
      <polygon points="1180,780 1100,780 1180,700" fill="#18181b" />

      <!-- Top Badge -->
      <g transform="translate(600, 110)">
        <rect x="-180" y="-20" width="360" height="40" fill="${primaryColor}" stroke="#18181b" stroke-width="3" rx="4"/>
        <text x="0" y="7" text-anchor="middle" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="3">${badgeTitle}</text>
      </g>

      <!-- Certificate Header -->
      <text x="600" y="190" text-anchor="middle" font-size="40" font-weight="900" fill="#18181b" letter-spacing="4">HACKNEXT CERTIFICATE</text>
      <text x="600" y="225" text-anchor="middle" font-size="16" font-weight="700" fill="#71717a" letter-spacing="2">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>

      <!-- Decorative Center Line -->
      <line x1="350" y1="245" x2="850" y2="245" stroke="#e4e4e7" stroke-width="2"/>
    `}

    <!-- Configurable Recipient Name Overlay (Centered perfectly at nameX=600) -->
    <text x="${nameX}" y="${nameY}" text-anchor="${textAnchor}" font-size="${nameFontSize}" font-weight="900" fill="${nameColor}">${recipientName}</text>
    ${!hasCustomBg && nameY <= 360 ? `
      <line 
        x1="${textAnchor === 'middle' ? (nameX - underlineHalfWidth) : textAnchor === 'start' ? nameX : (nameX - underlineHalfWidth * 2)}" 
        y1="${nameY + 20}" 
        x2="${textAnchor === 'middle' ? (nameX + underlineHalfWidth) : textAnchor === 'start' ? (nameX + underlineHalfWidth * 2) : nameX}" 
        y2="${nameY + 20}" 
        stroke="${primaryColor}" 
        stroke-width="2.5" 
        stroke-dasharray="6 3"
      />
    ` : ''}

    ${!hasCustomBg ? `
      <!-- Details Paragraph -->
      <text x="600" y="410" text-anchor="middle" font-size="20" font-weight="600" fill="#3f3f46">${subtitle}</text>
      <text x="600" y="455" text-anchor="middle" font-size="32" font-weight="900" fill="#18181b">${eventName}</text>
      ${teamName ? `<text x="600" y="500" text-anchor="middle" font-size="18" font-weight="700" fill="#71717a">Representing Team: <tspan fill="#18181b" font-weight="900">${teamName}</tspan></text>` : ''}

      <!-- Lower Divider -->
      <line x1="150" y1="560" x2="1050" y2="560" stroke="#e4e4e7" stroke-width="2"/>

      <!-- Signatures & Verification Details -->
      <!-- Left: Date -->
      <g transform="translate(240, 640)">
        <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" stroke-width="2"/>
        <text x="0" y="-15" text-anchor="middle" font-size="16" font-weight="900" fill="#18181b">${issueDate}</text>
        <text x="0" y="25" text-anchor="middle" font-size="13" font-weight="800" fill="#71717a" letter-spacing="1">DATE OF ISSUANCE</text>
      </g>

      <!-- Middle: Official Seal / Security Stamp -->
      <g transform="translate(600, 640)">
        <circle cx="0" cy="0" r="45" fill="#fafafa" stroke="${primaryColor}" stroke-width="4"/>
        <circle cx="0" cy="0" r="38" fill="none" stroke="#18181b" stroke-width="1.5" stroke-dasharray="4 2"/>
        <text x="0" y="-8" text-anchor="middle" font-size="10" font-weight="900" fill="#18181b" letter-spacing="1">VERIFIED</text>
        <text x="0" y="8" text-anchor="middle" font-size="13" font-weight="900" fill="${primaryColor}">★ ★ ★</text>
        <text x="0" y="22" text-anchor="middle" font-size="9" font-weight="900" fill="#71717a">HACKNEXT</text>
      </g>

      <!-- Right: Organizing Authority -->
      <g transform="translate(960, 640)">
        <line x1="-100" y1="0" x2="100" y2="0" stroke="#18181b" stroke-width="2"/>
        <text x="0" y="-15" text-anchor="middle" font-size="16" font-weight="900" fill="#18181b">HackNext Jury &amp; Lead</text>
        <text x="0" y="25" text-anchor="middle" font-size="13" font-weight="800" fill="#71717a" letter-spacing="1">ORGANIZER SIGNATURE</text>
      </g>
    ` : ''}

    <!-- Bottom Verification ID & Hash -->
    <g transform="translate(600, 740)">
      <text x="0" y="0" text-anchor="middle" font-size="11" font-weight="700" fill="#71717a" letter-spacing="1">
        CERTIFICATE ID: <tspan fill="#18181b" font-weight="900">${certNo}</tspan> • VERIFY AT: <tspan fill="#dc2626">/verify/certificate/${certNo}</tspan>
      </text>
      <text x="0" y="16" text-anchor="middle" font-size="9" font-family="monospace" fill="#71717a">
        SIG: ${signatureHash.substring(0, 32)}...
      </text>
    </g>
  </svg>`;
}

// 1. Get all templates for an event
router.get('/event/:eventId/templates', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    let templates = await prisma.certificateTemplate.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'asc' }
    });

    // Default template types if none exist
    if (templates.length === 0) {
      const defaults = [
        { type: 'WINNER_1', title: '1st Place Winner', primary: '#eab308', badge: '1ST PLACE WINNER', subtitle: 'For securing 1st place award in' },
        { type: 'WINNER_2', title: '2nd Place Winner', primary: '#94a3b8', badge: '2ND PLACE WINNER', subtitle: 'For securing 2nd place award in' },
        { type: 'WINNER_3', title: '3rd Place Winner', primary: '#d97706', badge: '3RD PLACE WINNER', subtitle: 'For securing 3rd place award in' },
        { type: 'PARTICIPANT', title: 'Certificate of Participation', primary: '#dc2626', badge: 'OFFICIAL PARTICIPATION', subtitle: 'For outstanding active participation and project development in' }
      ];

      for (const d of defaults) {
        const created = await prisma.certificateTemplate.create({
          data: {
            event_id: eventId,
            type: d.type,
            title: d.title,
            template_image_url: '/assets/certificate-default.png',
            config: {
              font_family: 'Inter',
              name_font_size: 46,
              name_x: 600,
              name_y: 325,
              name_color: '#dc2626',
              text_align: 'middle',
              primary_color: d.primary,
              badge_title: d.badge,
              subtitle: d.subtitle
            }
          }
        });
        templates.push(created);
      }
    }

    res.json(templates);
  } catch (err) {
    console.error('Failed to get certificate templates', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// 2. Create or update template
router.post('/event/:eventId/templates', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { id, type, title, template_image_url, config } = req.body;

    const standardConfig = config && Object.keys(config).length > 0 ? config : {
      name_x: 600,
      name_y: 325,
      name_font_size: 46,
      name_color: '#dc2626',
      font_family: 'Inter',
      text_align: 'middle',
      primary_color: '#dc2626',
      badge_title: (title || 'Special Award').toUpperCase(),
      subtitle: 'For outstanding innovation and excellence in'
    };

    if (id) {
      const updated = await prisma.certificateTemplate.update({
        where: { id },
        data: { 
          type, 
          title, 
          template_image_url: template_image_url !== undefined ? template_image_url : '/assets/certificate-default.png', 
          config: standardConfig 
        }
      });
      return res.json(updated);
    }

    const created = await prisma.certificateTemplate.create({
      data: {
        event_id: eventId,
        type: type || 'CUSTOM',
        title: title || 'Special Achievement Award',
        template_image_url: template_image_url || '/assets/certificate-default.png',
        config: standardConfig
      }
    });

    res.json(created);
  } catch (err) {
    console.error('Failed to save certificate template', err);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// 3. Delete template
router.delete('/templates/:id', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.certificateTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// 4. Check generation status
router.get(['/event/:eventId/status', '/events/:eventId/status'], requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const count = await prisma.certificate.count({ where: { event_id: eventId } });
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { show_certificates: true }
    });

    res.json({
      has_generated: count > 0,
      count,
      show_certificates: event?.show_certificates || false
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificate status' });
  }
});

// 5. Generate certificates for the event
router.post(['/event/:eventId/generate', '/events/:eventId/generate'], requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        timeline_items: { orderBy: { sort_order: 'asc' } },
        teams: {
          include: {
            members: { include: { user: true } },
            submissions: {
              include: { 
                scores: true,
                _count: { select: { votes: true } }
              }
            }
          }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if voting ended
    const now = new Date();
    const votingItem = event.timeline_items?.find(t => 
      (t.title || '').toLowerCase().includes('voting') || (t.title || '').toLowerCase().includes('community')
    );
    const isVotingEnded = Boolean(
      (votingItem && votingItem.end_datetime && now > new Date(votingItem.end_datetime)) ||
      (!event.community_voting_open && event.show_public_results)
    );

    // Collect all event submissions for leaderboard evaluation
    const allSubmissions = event.teams.flatMap(t => t.submissions.map(s => ({
      ...s,
      team: { name: t.name }
    })));

    const proofResult = calculateEventLeaderboardWithProof(
      event.id,
      event.name,
      allSubmissions as any,
      { isVotingEnded }
    );

    // Map submission rank back to team
    const subToTeamMap = new Map<string, string>();
    event.teams.forEach(t => {
      t.submissions.forEach(s => subToTeamMap.set(s.id, t.id));
    });

    const rank1Sub = proofResult.leaderboard.find(item => item.rank === 1);
    const rank2Sub = proofResult.leaderboard.find(item => item.rank === 2);
    const rank3Sub = proofResult.leaderboard.find(item => item.rank === 3);

    const winner1TeamId = rank1Sub ? subToTeamMap.get(rank1Sub.submissionId) : null;
    const winner2TeamId = rank2Sub ? subToTeamMap.get(rank2Sub.submissionId) : null;
    const winner3TeamId = rank3Sub ? subToTeamMap.get(rank3Sub.submissionId) : null;

    const winner1Team = event.teams.find(t => t.id === winner1TeamId);
    const winner2Team = event.teams.find(t => t.id === winner2TeamId);
    const winner3Team = event.teams.find(t => t.id === winner3TeamId);

    // Ensure event certificates directory exists
    const eventCertDir = path.join(CERTIFICATES_DIR, eventId);
    if (!fs.existsSync(eventCertDir)) {
      fs.mkdirSync(eventCertDir, { recursive: true });
    }

    // Delete old certificates for fresh re-generation
    await prisma.certificate.deleteMany({ where: { event_id: eventId } });

    const generatedCertificates: any[] = [];
    const issueDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Load event templates for styling
    const templates = await prisma.certificateTemplate.findMany({ where: { event_id: eventId } });
    const tmplMap = new Map<string, any>();
    templates.forEach(t => tmplMap.set(t.type, t));

    for (const teamItem of event.teams) {
      const isW1 = winner1TeamId && teamItem.id === winner1TeamId;
      const isW2 = winner2TeamId && teamItem.id === winner2TeamId;
      const isW3 = winner3TeamId && teamItem.id === winner3TeamId;

      let type = 'PARTICIPANT';
      let title = 'Certificate of Participation';

      if (isW1) {
        type = 'WINNER_1';
        title = '1st Place Winner';
      } else if (isW2) {
        type = 'WINNER_2';
        title = '2nd Place Winner';
      } else if (isW3) {
        type = 'WINNER_3';
        title = '3rd Place Winner';
      }

      const activeTmpl = tmplMap.get(type) || tmplMap.get('PARTICIPANT');
      const tmplConfig = activeTmpl?.config || {};
      const tmplImageUrl = activeTmpl?.template_image_url;

      for (const member of teamItem.members) {
        if (!member.user) continue;

        const certHex = crypto.randomBytes(4).toString('hex').toUpperCase();
        const certNo = `HNX-${new Date().getFullYear()}-${certHex}`;
        const recipientName = member.user.name || member.user.email?.split('@')[0] || 'Participant';

        // Compute SHA-256 cryptographic signature
        const hashInput = `${certNo}|${member.user.id}|${teamItem.id}|${eventId}|${type}|${issueDateStr}`;
        const signatureHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        // Generate SVG content and write locally
        const svgContent = generateCertificateSvg({
          certNo,
          recipientName,
          type,
          title: activeTmpl?.title || title,
          teamName: teamItem.name,
          eventName: event.name,
          issueDate: issueDateStr,
          signatureHash,
          templateImageUrl: tmplImageUrl,
          config: tmplConfig
        });

        const svgFilePath = path.join(eventCertDir, `${certNo}.svg`);
        fs.writeFileSync(svgFilePath, svgContent, 'utf-8');
        const fileUrl = `/uploads/certificates/${eventId}/${certNo}.svg`;

        const teamSub = teamItem.submissions[0];
        const teamLeaderboardItem = teamSub ? proofResult.leaderboard.find(l => l.submissionId === teamSub.id) : null;

        const certRecord = await prisma.certificate.create({
          data: {
            certificate_no: certNo,
            event_id: eventId,
            user_id: member.user.id,
            team_id: teamItem.id,
            type,
            title,
            recipient_name: recipientName,
            team_name: teamItem.name,
            event_name: event.name,
            issue_date: new Date(),
            file_url: fileUrl,
            signature_hash: signatureHash,
            metadata: {
              score: teamLeaderboardItem?.finalScore || 0,
              rank: isW1 ? 1 : isW2 ? 2 : isW3 ? 3 : null
            }
          }
        });

        generatedCertificates.push(certRecord);
      }
    }

    res.json({
      message: `Successfully generated ${generatedCertificates.length} certificates locally!`,
      count: generatedCertificates.length,
      winners: {
        winner_1: winner1Team?.name || 'None',
        winner_2: winner2Team?.name || 'None',
        winner_3: winner3Team?.name || 'None'
      }
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ error: 'Failed to generate certificates' });
  }
});

// 6. List all certificates for an event (Organizer view)
router.get('/event/:eventId/list', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const certs = await prisma.certificate.findMany({
      where: { event_id: eventId },
      include: {
        user: { select: { email: true, name: true, phone: true } }
      },
      orderBy: { created_at: 'asc' }
    });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// 7. Get logged-in participant's certificates
router.get('/my-certificates', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const certs = await prisma.certificate.findMany({
      where: {
        user_id: userId,
        event: { show_certificates: true }
      },
      include: {
        event: { select: { name: true, start_date: true, end_date: true } }
      },
      orderBy: { issue_date: 'desc' }
    });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch participant certificates' });
  }
});

// 8. Public certificate verification endpoint (Accessible without login)
router.get('/verify/:certNo', async (req, res) => {
  try {
    const { certNo } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { certificate_no: certNo },
      include: {
        event: { select: { id: true, name: true, start_date: true, end_date: true, organizer_name: true } }
      }
    });

    if (!cert) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate record not found or invalid identifier.'
      });
    }

    res.json({
      valid: true,
      certificateNo: cert.certificate_no,
      recipientName: cert.recipient_name,
      teamName: cert.team_name,
      type: cert.type,
      title: cert.title,
      eventName: cert.event_name,
      organizerName: cert.event.organizer_name || 'HackNext Organization',
      issueDate: cert.issue_date,
      fileUrl: cert.file_url,
      signatureHash: cert.signature_hash
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ valid: false, error: 'Failed to verify certificate' });
  }
});

export default router;
