
-- Criar tabela para metas mensais de gastos
CREATE TABLE public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para metas mensais
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Políticas para metas mensais
CREATE POLICY "Users can view their own monthly budgets" 
  ON public.monthly_budgets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly budgets" 
  ON public.monthly_budgets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly budgets" 
  ON public.monthly_budgets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly budgets" 
  ON public.monthly_budgets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índice único para evitar múltiplas metas no mesmo mês/ano
CREATE UNIQUE INDEX monthly_budgets_user_month_year_idx 
  ON public.monthly_budgets (user_id, month, year);
