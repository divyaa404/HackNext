import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

// Generate SVG Certificate content locally
function generateCertificateSvg(params: {
  certNo: string;
  recipientName: string;
  type: string;
  title: string;
  teamName?: string | null;
  eventName: string;
  issueDate: string;
  signatureHash: string;
}): string {
  const { certNo, recipientName, type, title, teamName, eventName, issueDate, signatureHash } = params;

  const isWinner1 = type === 'WINNER_1';
  const isWinner2 = type === 'WINNER_2';
  const isWinner3 = type === 'WINNER_3';
  const isWinner = isWinner1 || isWinner2 || isWinner3;

  const primaryColor = isWinner1 ? '#eab308' : isWinner2 ? '#94a3b8' : isWinner3 ? '#d97706' : '#dc2626';
  const badgeTitle = isWinner1 ? '1ST PLACE WINNER' : isWinner2 ? '2ND PLACE WINNER' : isWinner3 ? '3RD PLACE WINNER' : 'OFFICIAL PARTICIPATION';
  const subtitle = isWinner 
    ? `For securing ${title.toUpperCase()} at` 
    : 'For outstanding active participation and project development in';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" style="background:#ffffff; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
    <defs>
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="50%" stop-color="#18181b" />
        <stop offset="100%" stop-color="${primaryColor}" />
      </linearGradient>
    </defs>

    <!-- Outer Decorative Border -->
    <rect x="20" y="20" width="1160" height="760" fill="#ffffff" stroke="#18181b" stroke-width="8"/>
    <rect x="35" y="35" width="1130" height="730" fill="#fafafa" stroke="url(#borderGrad)" stroke-width="4"/>
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

    <!-- Decorative Line -->
    <line x1="350" y1="245" x2="850" y2="245" stroke="#e4e4e7" stroke-width="2"/>

    <!-- Recipient Name -->
    <text x="600" y="325" text-anchor="middle" font-size="46" font-weight="900" fill="#dc2626" letter-spacing="1">${recipientName}</text>
    <line x1="300" y1="355" x2="900" y2="355" stroke="#18181b" stroke-width="3" stroke-dasharray="8 4"/>

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

    <!-- Bottom Verification ID & Hash -->
    <g transform="translate(600, 735)">
      <text x="0" y="0" text-anchor="middle" font-size="11" font-weight="700" fill="#a1a1aa" letter-spacing="1">
        CERTIFICATE ID: <tspan fill="#18181b" font-weight="900">${certNo}</tspan> • VERIFY AT: <tspan fill="#dc2626">/verify/certificate/${certNo}</tspan>
      </text>
      <text x="0" y="16" text-anchor="middle" font-size="9" font-family="monospace" fill="#a1a1aa">
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
        { type: 'WINNER_1', title: '1st Place Winner' },
        { type: 'WINNER_2', title: '2nd Place Winner' },
        { type: 'WINNER_3', title: '3rd Place Winner' },
        { type: 'PARTICIPANT', title: 'Certificate of Participation' }
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
              name_font_size: 44,
              name_color: '#dc2626',
              text_align: 'center'
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

    if (id) {
      const updated = await prisma.certificateTemplate.update({
        where: { id },
        data: { type, title, template_image_url, config }
      });
      return res.json(updated);
    }

    const created = await prisma.certificateTemplate.create({
      data: {
        event_id: eventId,
        type: type || 'CUSTOM',
        title: title || 'Special Achievement Award',
        template_image_url: template_image_url || '/assets/certificate-default.png',
        config: config || {}
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
        teams: {
          include: {
            members: { include: { user: true } },
            submissions: {
              include: { scores: true }
            }
          }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Calculate ranking of teams by average/total score
    const rankedTeams = event.teams
      .map(team => {
        const sub = team.submissions[0];
        let avgScore = 0;
        if (sub && sub.scores.length > 0) {
          const total = sub.scores.reduce((a, b) => a + (b.weighted_score || b.raw_score || 0), 0);
          avgScore = total / sub.scores.length;
        }
        return {
          team,
          submission: sub,
          avgScore
        };
      })
      .filter(t => t.submission)
      .sort((a, b) => b.avgScore - a.avgScore);

    // Ensure event certificates directory exists
    const eventCertDir = path.join(CERTIFICATES_DIR, eventId);
    if (!fs.existsSync(eventCertDir)) {
      fs.mkdirSync(eventCertDir, { recursive: true });
    }

    // Delete old certificates for fresh re-generation
    await prisma.certificate.deleteMany({ where: { event_id: eventId } });

    const generatedCertificates: any[] = [];
    const issueDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Determine 1st, 2nd, 3rd place winners
    const winner1Team = rankedTeams[0]?.team;
    const winner2Team = rankedTeams[1]?.team;
    const winner3Team = rankedTeams[2]?.team;

    for (const teamItem of event.teams) {
      const isW1 = winner1Team && teamItem.id === winner1Team.id;
      const isW2 = winner2Team && teamItem.id === winner2Team.id;
      const isW3 = winner3Team && teamItem.id === winner3Team.id;

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
          title,
          teamName: teamItem.name,
          eventName: event.name,
          issueDate: issueDateStr,
          signatureHash
        });

        const svgFilePath = path.join(eventCertDir, `${certNo}.svg`);
        fs.writeFileSync(svgFilePath, svgContent, 'utf-8');
        const fileUrl = `/uploads/certificates/${eventId}/${certNo}.svg`;

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
              score: rankedTeams.find(t => t.team.id === teamItem.id)?.avgScore || 0,
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
