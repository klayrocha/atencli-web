import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';

interface Consulta {
  hora: string;
  nome: string;
  especialidade: string;
  status: 'Confirmada' | 'Aguardando confirmação' | 'Cancelada';
  iniciais: string;
  cor: string;
}

interface Acao {
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  botao: string;
  icone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    ChartModule,
    DividerModule,
    BadgeModule,
    TooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private auth = inject(AuthService);

  readonly userName = computed(() => {
    const name = this.auth.currentProfile()?.fullName ?? this.auth.currentUser()?.name ?? '';
    return name.split(' ')[0] || 'você';
  });

  acoes: Acao[] = [
    {
      prioridade: 'alta',
      titulo: 'Fernanda espera há 22 minutos',
      descricao: 'Perguntou sobre implante e ainda não recebeu resposta.',
      botao: 'Responder',
      icone: 'pi-clock'
    },
    {
      prioridade: 'media',
      titulo: '5 conversas estão sem responsável',
      descricao: 'A conversa mais antiga entrou às 9h18.',
      botao: 'Distribuir',
      icone: 'pi-users'
    },
    {
      prioridade: 'baixa',
      titulo: '4 consultas ainda não foram confirmadas',
      descricao: 'A primeira consulta acontece hoje às 14h.',
      botao: 'Confirmar',
      icone: 'pi-calendar'
    }
  ];

  consultas: Consulta[] = [
    {
      hora: '14:00',
      nome: 'Mariana Silva',
      especialidade: 'Avaliação de implante',
      status: 'Aguardando confirmação',
      iniciais: 'MS',
      cor: '#f59e0b'
    },
    {
      hora: '15:30',
      nome: 'Carlos Souza',
      especialidade: 'Ortodontia',
      status: 'Confirmada',
      iniciais: 'CS',
      cor: '#6b7280'
    },
    {
      hora: '16:20',
      nome: 'Patrícia Lima',
      especialidade: 'Retorno',
      status: 'Confirmada',
      iniciais: 'PL',
      cor: '#8b5cf6'
    }
  ];

  pulsoStats = [
    { icon: 'pi-comments', value: 12, label: 'esperando resposta', sub: 'Mais antigo: 22 min' },
    { icon: 'pi-check-square', value: 3, label: 'tarefas atrasadas', sub: 'Mais antigo: 1h 15min' },
    { icon: 'pi-calendar', value: 4, label: 'consultas sem confirmação', sub: 'Primeira hoje às 14h' },
    { icon: 'pi-users', value: 2, label: 'transferidas pela IA', sub: 'Precisa de revisão' },
  ];

  jornadaSteps = [
    { icon: 'pi-users', value: 38, label: 'novos contatos', pct: '100% do início', color: '#84cc16' },
    { icon: 'pi-calendar', value: 17, label: 'consultas marcadas', pct: '45% dos contatos', color: '#84cc16' },
    { icon: 'pi-check', value: 11, label: 'compareceram', pct: '65% das consultas', color: '#84cc16' },
    { icon: 'pi-heart', value: 6, label: 'pacientes conquistados', pct: '16,8% dos contatos', color: '#84cc16' },
  ];

  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    this.chartData = {
      datasets: [{
        data: [5, 95],
        backgroundColor: ['#84cc16', '#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 0,
      }]
    };

    this.chartOptions = {
      cutout: '78%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800
      }
    };
  }

  getStatusClass(status: string): string {
    if (status === 'Confirmada') return 'badge-green';
    if (status === 'Aguardando confirmação') return 'badge-yellow';
    return 'badge-orange';
  }

  getPrioridadeCor(p: string): string {
    if (p === 'alta') return '#ef4444';
    if (p === 'media') return '#f59e0b';
    return '#3b82f6';
  }

  getPrioridadeBg(p: string): string {
    if (p === 'alta') return '#fef2f2';
    if (p === 'media') return '#fefce8';
    return '#eff6ff';
  }
}
