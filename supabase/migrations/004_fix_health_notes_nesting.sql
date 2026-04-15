-- Fix health_notes rows where migration 002 double-wrapped the array:
-- [["high protein", "dairy-free"]] → ["high protein", "dairy-free"]
update recipes
set health_notes = (
  select jsonb_agg(elem)
  from jsonb_array_elements(health_notes) as outer_elem,
       jsonb_array_elements(outer_elem) as elem
)
where jsonb_typeof(health_notes) = 'array'
  and jsonb_array_length(health_notes) > 0
  and jsonb_typeof(health_notes -> 0) = 'array';
