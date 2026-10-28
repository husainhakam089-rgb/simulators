#!/bin/sh
# يبني ملف الفصل الثاني من القطع بالترتيب
cd "$(dirname "$0")"
cat a_head.html b_body.html c_data.js d_defs.js e_flow.js r_stages.js s1_mer.js h_engine.js k_3d.js l_models.js $(ls m[0-9]_*.js 2>/dev/null) q_drawcfg.js q_draw.js i_exam.js > full.html
awk '/^<script>$/{f=1;next}/^<\/script>$/{f=0}f' full.html > extract.js && node --check extract.js && echo built $(wc -c < full.html)
