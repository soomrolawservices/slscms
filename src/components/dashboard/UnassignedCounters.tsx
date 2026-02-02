import { AlertTriangle, Users, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export function UnassignedCounters() {
  const { data: clients = [] } = useClients();
  const { data: cases = [] } = useCases();
  const navigate = useNavigate();

  const unassigned = useMemo(() => {
    // A client is unassigned if assigned_to is null or empty
    const unassignedClients = clients.filter(c => !c.assigned_to);
    // A case is unassigned if assigned_to is null or empty
    const unassignedCases = cases.filter(c => !c.assigned_to);

    return {
      clients: unassignedClients.length,
      cases: unassignedCases.length,
      hasUnassigned: unassignedClients.length > 0 || unassignedCases.length > 0,
    };
  }, [clients, cases]);

  if (!unassigned.hasUnassigned) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Unassigned Items Need Attention</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              There are items waiting to be assigned to team members.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              {unassigned.clients > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
                  onClick={() => navigate('/clients')}
                >
                  <Users className="h-4 w-4" />
                  {unassigned.clients} Unassigned Client{unassigned.clients > 1 ? 's' : ''}
                </Button>
              )}
              {unassigned.cases > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
                  onClick={() => navigate('/cases')}
                >
                  <Briefcase className="h-4 w-4" />
                  {unassigned.cases} Unassigned Case{unassigned.cases > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
