import { NextRequest, NextResponse } from 'next/server';

/**
 * Competitor comparison data
 */
interface Competitor {
  id: string;
  name: string;
  description: string;
  pricing: {
    starter: string;
    professional: string;
    enterprise: string;
  };
  features: {
    whatsappIntegration: boolean;
    aiPowered: boolean;
    analytics: boolean;
    multiChannel: boolean;
    automation: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    support247: boolean;
  };
  rating: number;
  setupTime: string;
  limitations: string[];
}

/**
 * GET /api/competitors
 * Returns list of competitors for comparison
 */
export async function GET(request: NextRequest) {
  try {
    const competitors: Competitor[] = [
      {
        id: 'neptunik',
        name: 'Neptunik',
        description: 'Plataforma completa de WhatsApp Business API con IA integrada',
        pricing: {
          starter: '$49/mes',
          professional: '$199/mes',
          enterprise: 'Personalizado',
        },
        features: {
          whatsappIntegration: true,
          aiPowered: true,
          analytics: true,
          multiChannel: true,
          automation: true,
          customBranding: true,
          apiAccess: true,
          support247: true,
        },
        rating: 5.0,
        setupTime: '5 minutos',
        limitations: [],
      },
      {
        id: 'twilio',
        name: 'Twilio',
        description: 'Plataforma de comunicaciones con API de WhatsApp',
        pricing: {
          starter: 'Pay as you go',
          professional: 'Pay as you go',
          enterprise: 'Personalizado',
        },
        features: {
          whatsappIntegration: true,
          aiPowered: false,
          analytics: true,
          multiChannel: true,
          automation: true,
          customBranding: false,
          apiAccess: true,
          support247: true,
        },
        rating: 4.2,
        setupTime: '2-3 días',
        limitations: [
          'Requiere conocimientos técnicos avanzados',
          'Sin IA integrada',
          'Costos variables difíciles de predecir',
        ],
      },
      {
        id: 'messagebird',
        name: 'MessageBird',
        description: 'Plataforma de mensajería omnicanal',
        pricing: {
          starter: '$25/mes',
          professional: '$100/mes',
          enterprise: 'Personalizado',
        },
        features: {
          whatsappIntegration: true,
          aiPowered: false,
          analytics: true,
          multiChannel: true,
          automation: true,
          customBranding: true,
          apiAccess: true,
          support247: false,
        },
        rating: 4.0,
        setupTime: '1-2 días',
        limitations: [
          'IA limitada o no incluida',
          'Soporte 24/7 solo en plan enterprise',
          'Interfaz menos intuitiva',
        ],
      },
      {
        id: 'chatapi',
        name: 'Chat API',
        description: 'API no oficial de WhatsApp',
        pricing: {
          starter: '$39/mes',
          professional: '$89/mes',
          enterprise: '$199/mes',
        },
        features: {
          whatsappIntegration: true,
          aiPowered: false,
          analytics: false,
          multiChannel: false,
          automation: true,
          customBranding: false,
          apiAccess: true,
          support247: false,
        },
        rating: 3.5,
        setupTime: '30 minutos',
        limitations: [
          'No es API oficial de WhatsApp',
          'Riesgo de bloqueo de cuenta',
          'Sin analytics avanzados',
          'Sin IA',
        ],
      },
      {
        id: 'wati',
        name: 'Wati',
        description: 'Plataforma de WhatsApp Business para equipos',
        pricing: {
          starter: '$49/mes',
          professional: '$99/mes',
          enterprise: 'Personalizado',
        },
        features: {
          whatsappIntegration: true,
          aiPowered: false,
          analytics: true,
          multiChannel: false,
          automation: true,
          customBranding: true,
          apiAccess: true,
          support247: false,
        },
        rating: 4.3,
        setupTime: '1 hora',
        limitations: [
          'Sin IA integrada',
          'Solo WhatsApp, no multicanal',
          'Funcionalidades limitadas en planes básicos',
        ],
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: competitors,
        meta: {
          total: competitors.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch competitors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
