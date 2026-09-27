import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get public event details by slug
router.get('/:slug/public', async (req, res) => {
  try {
    let event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        eligibility_items: { orderBy: { sort_order: 'asc' } },
        rules: { orderBy: { sort_order: 'asc' } },
        prizes: { orderBy: { sort_order: 'asc' } },
        timeline_items: { orderBy: { sort_order: 'asc' } },
        admin_contacts: { orderBy: { sort_order: 'asc' } },
        _count: {
          select: { 
            teams: true, 
            submissions: { where: { status: 'submitted' } } 
          }
        }
      }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        include: {
          eligibility_items: { orderBy: { sort_order: 'asc' } },
          rules: { orderBy: { sort_order: 'asc' } },
          prizes: { orderBy: { sort_order: 'asc' } },
          timeline_items: { orderBy: { sort_order: 'asc' } },
          admin_contacts: { orderBy: { sort_order: 'asc' } },
          _count: {
            select: { 
              teams: true, 
              submissions: { where: { status: 'submitted' } } 
            }
          }
        }
      });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const publicData = {
      id: event.id,
      slug: event.slug,
      name: event.name,
      short_description: event.short_description,
      full_description: event.full_description,
      start_date: event.start_date,
      end_date: event.end_date,
      category: event.category,
      mode: event.mode,
      location: event.location,
      team_size_min: event.team_size_min,
      team_size_max: event.team_size_max,
      prize_pool: event.prize_pool,
      organizer_name: event.organizer_name,
      organizer_logo: event.organizer_logo,
      banner_url: event.banner_url,
      
      show_public_teams: event.show_public_teams,
      show_public_projects: event.show_public_projects,
      show_public_judges: event.show_public_judges,
      show_public_results: event.show_public_results,
      show_eligibility: event.show_eligibility,
      show_rules: event.show_rules,
      show_prizes: event.show_prizes,
      show_timeline: event.show_timeline,
      show_contacts: event.show_contacts,
      show_certificates: event.show_certificates,
      show_public_voting: event.show_public_voting,
      community_voting_open: event.community_voting_open,

      eligibility_items: event.show_eligibility ? event.eligibility_items : [],
      rules: event.show_rules ? event.rules : [],
      prizes: event.show_prizes ? event.prizes : [],
      timeline_items: event.show_timeline ? event.timeline_items : [],
      admin_contacts: event.show_contacts ? event.admin_contacts : [],
      
      team_count: event.show_public_teams ? event._count.teams : 0,
      project_count: event.show_public_projects ? event._count.submissions : 0,
    };

    res.json(publicData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public teams
router.get('/:slug/public/teams', async (req, res) => {
  try {
    let event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, show_public_teams: true }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        select: { id: true, show_public_teams: true }
      });
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const teams = await prisma.team.findMany({
      where: { event_id: event.id },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } }
      }
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public projects (Clean list of project title and description only)
router.get('/:slug/public/projects', async (req, res) => {
  try {
    let event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, show_public_projects: true, name: true }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        select: { id: true, show_public_projects: true, name: true }
      });
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const projects = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      select: {
        id: true,
        title: true,
        description: true,
        team: { select: { id: true, name: true } }
      }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public results / leaderboard
router.get('/:slug/public/results', async (req, res) => {
  try {
    let event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, show_public_results: true, name: true }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { start_date: 'desc' },
        select: { id: true, show_public_results: true, name: true }
      });
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const submissions = await prisma.submission.findMany({
      where: { event_id: event.id, status: 'submitted' },
      include: {
        team: { select: { id: true, name: true } },
        scores: true
      }
    });

    const results = submissions.map(sub => {
      const totalScore = sub.scores.reduce((acc, s) => acc + (s.weighted_score || s.raw_score || 0), 0);
      const avgScore = sub.scores.length > 0 ? totalScore / sub.scores.length : 0;
      return {
        id: sub.id,
        title: sub.title,
        description: sub.description,
        repo_url: sub.repo_url,
        demo_video_url: sub.demo_video_url,
        teamName: sub.team?.name || 'Unknown Team',
        totalScore: Math.round(avgScore * 10) / 10,
        evaluationsCount: sub.scores.length,
        submitted_at: sub.submitted_at
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      eventName: event.name,
      results
    });
  } catch (error) {
    console.error('Public results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
