import { NextRequest, NextResponse } from 'next/server';
import { SyntheticLoadGenerator } from '@/lib/network-testing/synthetic-load-generator';

const loadGenerator = new SyntheticLoadGenerator();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'patterns':
        const patterns = loadGenerator.getTransactionPatterns();
        return NextResponse.json({ success: true, data: patterns });

      case 'load-profiles':
        const profiles = loadGenerator.getLoadProfiles();
        return NextResponse.json({ success: true, data: profiles });

      case 'user-behaviors':
        const behaviors = loadGenerator.getUserBehaviors();
        return NextResponse.json({ success: true, data: behaviors });

      case 'generation-history':
        const history = loadGenerator.getGenerationHistory();
        return NextResponse.json({ success: true, data: history });

      case 'active-generations':
        const activeGenerations = loadGenerator.getActiveGenerations();
        return NextResponse.json({ success: true, data: activeGenerations });

      case 'generation':
        const generationId = searchParams.get('id');
        if (!generationId) {
          return NextResponse.json({ success: false, error: 'Generation ID required' }, { status: 400 });
        }
        const generation = loadGenerator.getGeneration(generationId);
        if (!generation) {
          return NextResponse.json({ success: false, error: 'Generation not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: generation });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Load generator API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'generate-load':
        const { profileId, regions, userBehaviors, customPatterns, startTime } = params;
        if (!profileId) {
          return NextResponse.json({ success: false, error: 'Profile ID required' }, { status: 400 });
        }

        const options = {
          regions: regions || undefined,
          userBehaviors: userBehaviors || undefined,
          customPatterns: customPatterns || undefined,
          startTime: startTime ? new Date(startTime) : undefined
        };

        const result = await loadGenerator.generateLoad(profileId, options);
        return NextResponse.json({ success: true, data: result });

      case 'create-custom-profile':
        const { name, description, duration, phases, overall } = params;
        if (!name || !duration || !phases || !overall) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing required parameters: name, duration, phases, overall' 
          }, { status: 400 });
        }

        const customProfile = loadGenerator.createCustomLoadProfile({
          name,
          description: description || '',
          duration,
          phases,
          overall
        });

        return NextResponse.json({ success: true, data: customProfile });

      case 'analyze-patterns':
        const { transactions } = params;
        if (!transactions || !Array.isArray(transactions)) {
          return NextResponse.json({ success: false, error: 'Transactions array required' }, { status: 400 });
        }

        const analysis = loadGenerator.analyzeTransactionPatterns(transactions);
        return NextResponse.json({ success: true, data: analysis });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Load generator API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}