-- Allow public update for questions table
CREATE POLICY "Allow public update questions"
ON public.questions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public delete for questions table
CREATE POLICY "Allow public delete questions"
ON public.questions
FOR DELETE
TO public
USING (true);
