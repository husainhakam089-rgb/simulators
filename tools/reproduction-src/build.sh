#!/bin/sh
# يبني ملف الفصل الثالث (التكاثر) من القطع بالترتيب — نفس محرك الفصل الثاني (tools/tissues-src)
cd "$(dirname "$0")"
cat a_head.html b_body.html c_data.js d_defs.js e_flow.js r_stages.js s1_intro.js s2_virprok.js s3_protfung.js s4_plants.js s5_flower.js s6_seed.js s7_animals.js s8_human.js h_engine.js k_3d.js $(ls m[0-9]_*.js 2>/dev/null) q_drawcfg.js q_draw.js i_exam.js > full.html
awk '/^<script>$/{f=1;next}/^<\/script>$/{f=0}f' full.html > extract.js && node --check extract.js && echo built $(wc -c < full.html)
