import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { base64Image } = await req.json();

    if (!base64Image) {
      return new Response(JSON.stringify({ error: 'Missing base64Image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a receipt parsing assistant. Analyze this receipt image and extract the following information in JSON format:

{
  "items": [
    {"id": "uuid", "name": "item name", "price": 0.00, "quantity": 1}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00,
  "merchant": "restaurant name",
  "date": "YYYY-MM-DD",
  "confidence": <calculated>
}

CRITICAL - AUSTRALIAN RECEIPTS (AUD):
All prices on Australian receipts INCLUDE GST. The "Subtotal" and "Tax/GST" lines just show the GST breakdown — the GST is ALREADY included in the item prices. Therefore:
- Set "subtotal" to the receipt TOTAL (the final amount paid)
- Set "tax" to 0 (GST is already included in item prices, do NOT add it again)
- Set "total" to the same value as subtotal
- All item prices must sum to the receipt TOTAL (the final amount paid)

CRITICAL - PRICE INTERPRETATION:
The "price" field must be the PER-UNIT price, NOT the line total.
- If a line shows "2 Burger $20.00", the $20 is the LINE TOTAL for 2 burgers
  - price should be: 10.00 (20 ÷ 2 = 10 per burger)
  - quantity should be: 2
- If a line shows "Burger $10.00", then price: 10.00, quantity: 1

IMPORTANT RULES:
1. Extract ONLY top-level purchasable items (meals, combos, boxes, individual items, standalone add-ons)
2. ALWAYS calculate per-unit price by dividing the line total by quantity
3. Generate a unique ID for each item (use simple incrementing numbers like "1", "2", "3")
4. If quantity is not shown, assume quantity = 1
5. Set subtotal to the receipt TOTAL (the final amount paid, GST-inclusive)
6. Set tax to 0 (GST is already included in item prices)
7. Extract tip amount (if shown, otherwise set to 0)
8. Set total to the final amount on the receipt
9. COMBO/BOX/MEAL DEALS: Items like "Zing Box", "Big Mac Meal", "Family Feast", etc. are COMBO items. The items listed underneath them (burger, chips, drink, sides, etc.) are what COMES WITH the combo — they are NOT separate charges. Only output the combo/box/meal as ONE item at the combo price. Do NOT list individual combo contents as separate items. To identify combo contents: sum the prices of items listed under a combo. If they equal the combo price, they are combo contents.
10. STANDALONE ADD-ONS: If an item listed under a combo causes the sum of sub-items to EXCEED the combo price, that item is a STANDALONE ADD-ON — list it as its own separate item.
11. MODIFIERS: Items like "No Mayo", "Extra Cheese", "$0.00" customisations listed under a combo are just modifications — ignore them entirely, do NOT create items for them.
12. VERIFY: The sum of all item prices times quantities MUST equal the receipt TOTAL (the final amount paid, GST-inclusive). If it doesn't, you likely missed a standalone add-on or incorrectly merged an item into a combo. Go back and check.
13. CONFIDENCE SCORING - Set based on how well you could read the receipt:
   - 0.98-1.0: Perfect quality, all text crystal clear
   - 0.90-0.97: Good quality, most text readable
   - 0.80-0.89: Moderate quality, some items may be unclear
   - 0.70-0.79: Poor quality, had to guess some values
   - Below 0.70: Very poor quality, many items unreadable

Return ONLY the JSON object, no additional text.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-receipt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
