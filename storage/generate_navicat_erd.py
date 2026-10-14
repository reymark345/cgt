import os
import json
import shutil
from PIL import Image, ImageDraw, ImageFont

def generate_erd():
    # Load schema dump
    schema_path = 'storage/schema_dump.json'
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    # Canvas dimensions
    WIDTH = 3100
    HEIGHT = 2500
    img = Image.new('RGB', (WIDTH, HEIGHT), '#F4F6F9')
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
        font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
        font_header = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)
        font_tag = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 11)
        font_col_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 12)
        font_col = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 12)
        font_type = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 11)
        font_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 9)
        font_card_badge = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 10)
        font_panel_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 13)
        font_panel_body = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 11)
    except Exception as e:
        print(f"Font error: {e}, falling back to default")
        font_title = font_subtitle = font_header = font_tag = font_col_bold = font_col = font_type = font_badge = font_card_badge = font_panel_title = font_panel_body = ImageFont.load_default()

    # 1. Draw Navicat Dotted Grid Background
    grid_spacing = 24
    dot_color = '#CBD5E1'
    for x in range(0, WIDTH, grid_spacing):
        for y in range(0, HEIGHT, grid_spacing):
            draw.point((x, y), fill=dot_color)

    # Table categories and colors (Navicat Palette)
    colors = {
        'grantee_list': {'header': '#1E40AF', 'accent': '#3B82F6', 'category': 'Master Beneficiary Table'},
        'emv_database': {'header': '#065F46', 'accent': '#10B981', 'category': 'EMV Card Database'},
        'payroll': {'header': '#3730A3', 'accent': '#6366F1', 'category': 'Payroll & Disbursements'},
        'household_requests': {'header': '#5B21B6', 'accent': '#8B5CF6', 'category': 'Central Request Hub'},
        'request': {'header': '#6D28D9', 'accent': '#A78BFA', 'category': 'Request Types Catalog'},
        'opening': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Account Opening'},
        'distribution': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Card Distribution'},
        'otc_withdrawal': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: OTC Withdrawal'},
        'replacement': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Card Replacement'},
        'transfer_of_fund': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Fund Transfer'},
        'force_pin': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Force PIN'},
        'locking': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Card Locking'},
        'lifting': {'header': '#0369A1', 'accent': '#0284C7', 'category': 'Workflow: Card Lifting'},
        'users': {'header': '#334155', 'accent': '#64748B', 'category': 'System Authentication & Staff'},
    }

    # Table Layout Specifications (Column layout)
    table_coords = {
        # Column 1 (Left)
        'users': {'x': 80, 'y': 200, 'w': 540, 'limit_cols': 22},
        'request': {'x': 80, 'y': 840, 'w': 540},
        'household_requests': {'x': 80, 'y': 1080, 'w': 540},
        
        # Column 2 (Center-Left: Master Hub & Left Workflows)
        'grantee_list': {'x': 740, 'y': 200, 'w': 620},
        'opening': {'x': 740, 'y': 1270, 'w': 620},
        'transfer_of_fund': {'x': 740, 'y': 1660, 'w': 620},
        'locking': {'x': 740, 'y': 2050, 'w': 620},

        # Column 3 (Center-Right: EMV & Center Workflows)
        'emv_database': {'x': 1480, 'y': 200, 'w': 600},
        'distribution': {'x': 1480, 'y': 860, 'w': 600},
        'otc_withdrawal': {'x': 1480, 'y': 1250, 'w': 600},
        'force_pin': {'x': 1480, 'y': 1640, 'w': 600},
        'lifting': {'x': 1480, 'y': 1990, 'w': 600},

        # Column 4 (Right: Payroll & Replacement)
        'payroll': {'x': 2200, 'y': 200, 'w': 640},
        'replacement': {'x': 2200, 'y': 1140, 'w': 640},
    }

    ROW_HEIGHT = 23
    HEADER_HEIGHT = 36

    anchors = {}
    table_bounds = {}

    # Render Tables
    for t_name, pos in table_coords.items():
        x = pos['x']
        y = pos['y']
        w = pos['w']
        cols = schema.get(t_name, [])
        limit = pos.get('limit_cols', len(cols))
        displayed_cols = cols[:limit]
        has_truncated = len(cols) > limit
        num_rows = len(displayed_cols) + (1 if has_truncated else 0)
        h = HEADER_HEIGHT + num_rows * ROW_HEIGHT + 6

        table_bounds[t_name] = {'x': x, 'y': y, 'w': w, 'h': h, 'x_right': x + w, 'y_bottom': y + h}

        # Drop Shadow
        for offset in range(3, 0, -1):
            draw.rounded_rectangle([x + offset, y + offset, x + w + offset, y + h + offset], radius=6, fill='#E2E8F0')

        # Container
        draw.rounded_rectangle([x, y, x + w, y + h], radius=6, fill='#FFFFFF', outline='#94A3B8', width=1)

        # Header Bar
        t_style = colors.get(t_name, {'header': '#334155', 'category': 'Table'})
        header_color = t_style['header']
        draw.rounded_rectangle([x, y, x + w, y + HEADER_HEIGHT], radius=6, fill=header_color)
        draw.rectangle([x, y + HEADER_HEIGHT - 6, x + w, y + HEADER_HEIGHT], fill=header_color)
        draw.line([x, y + HEADER_HEIGHT, x + w, y + HEADER_HEIGHT], fill='#0F172A', width=1)

        # Header Icon
        ix, iy = x + 12, y + 10
        draw.rectangle([ix, iy, ix + 14, iy + 14], outline='#FFFFFF', fill=None, width=1)
        draw.line([ix, iy + 5, ix + 14, iy + 5], fill='#FFFFFF', width=1)
        draw.line([ix + 7, iy, ix + 7, iy + 14], fill='#FFFFFF', width=1)

        # Title
        draw.text((x + 34, y + 8), t_name, fill='#FFFFFF', font=font_header)

        # Category / Engine Tag
        tag_text = f"InnoDB • {len(cols)} cols"
        bbox = font_tag.getbbox(tag_text)
        tag_w = bbox[2] - bbox[0]
        draw.text((x + w - tag_w - 12, y + 11), tag_text, fill='#E2E8F0', font=font_tag)

        # Rows
        curr_y = y + HEADER_HEIGHT
        for idx, col in enumerate(displayed_cols):
            f_name = col['field']
            f_type = col['type']
            f_key = col.get('key', '')

            is_hh_hub = (
                (t_name == 'grantee_list' and f_name == 'hh_id') or
                (t_name == 'emv_database' and f_name == 'hh_id') or
                (t_name == 'payroll' and f_name == 'household_id') or
                (t_name == 'household_requests' and f_name == 'hh_id') or
                (f_name == 'household_id_number')
            )

            is_req_link = (f_name in ['request_name', 'name'] and t_name in ['request', 'household_requests'])
            is_user_link = (f_name == 'created_by')

            row_bg = '#FFFFFF' if idx % 2 == 0 else '#F8FAFC'
            if is_hh_hub:
                row_bg = '#FEF3C7'  # Highlight household ID hub
            elif is_req_link:
                row_bg = '#EDE9FE'
            elif is_user_link:
                row_bg = '#F1F5F9'

            draw.rectangle([x + 1, curr_y, x + w - 1, curr_y + ROW_HEIGHT], fill=row_bg)
            draw.line([x + 1, curr_y + ROW_HEIGHT, x + w - 1, curr_y + ROW_HEIGHT], fill='#E2E8F0', width=1)

            # Left Badge
            badge_x = x + 10
            badge_y = curr_y + 4
            if f_key == 'PRI':
                draw.rounded_rectangle([badge_x, badge_y, badge_x + 22, badge_y + 13], radius=3, fill='#D97706')
                draw.text((badge_x + 4, badge_y + 1), "PK", fill='#FFFFFF', font=font_badge)
            elif is_hh_hub:
                draw.rounded_rectangle([badge_x, badge_y, badge_x + 22, badge_y + 13], radius=3, fill='#2563EB')
                draw.text((badge_x + 4, badge_y + 1), "FK", fill='#FFFFFF', font=font_badge)
            elif is_req_link or is_user_link:
                draw.rounded_rectangle([badge_x, badge_y, badge_x + 22, badge_y + 13], radius=3, fill='#7C3AED' if is_req_link else '#64748B')
                draw.text((badge_x + 4, badge_y + 1), "FK", fill='#FFFFFF', font=font_badge)

            # Field Name
            text_x = x + 38
            text_y = curr_y + 4
            col_font = font_col_bold if (f_key == 'PRI' or is_hh_hub) else font_col
            name_color = '#1E3A8A' if is_hh_hub else '#0F172A'
            draw.text((text_x, text_y), f_name, fill=name_color, font=col_font)

            # Data Type
            type_bbox = font_type.getbbox(f_type)
            type_w = type_bbox[2] - type_bbox[0]
            type_x = x + w - type_w - 12
            type_y = curr_y + 5
            type_color = '#475569' if is_hh_hub else '#64748B'
            draw.text((type_x, type_y), f_type, fill=type_color, font=font_type)

            anchors[(t_name, f_name)] = {
                'x_left': x,
                'x_right': x + w,
                'y_mid': curr_y + ROW_HEIGHT // 2
            }

            curr_y += ROW_HEIGHT

        if has_truncated:
            draw.rectangle([x + 1, curr_y, x + w - 1, curr_y + ROW_HEIGHT], fill='#F1F5F9')
            draw.text((x + 14, curr_y + 4), f"... [{len(cols) - limit} additional profile columns]", fill='#64748B', font=font_col)

    # Crow's Foot End Helper
    def draw_crows_foot(draw, x, y, direction='left', color='#2563EB'):
        size = 10
        if direction == 'right':
            draw.line([(x, y), (x + size, y - size//2)], fill=color, width=2)
            draw.line([(x, y), (x + size, y)], fill=color, width=2)
            draw.line([(x, y), (x + size, y + size//2)], fill=color, width=2)
            draw.line([(x + size + 4, y - size//2), (x + size + 4, y + size//2)], fill=color, width=2)
            # Small Cardinality label 'N'
            draw.text((x + size + 8, y - 14), "N", fill=color, font=font_card_badge)
        elif direction == 'left':
            draw.line([(x, y), (x - size, y - size//2)], fill=color, width=2)
            draw.line([(x, y), (x - size, y)], fill=color, width=2)
            draw.line([(x, y), (x - size, y + size//2)], fill=color, width=2)
            draw.line([(x - size - 4, y - size//2), (x - size - 4, y + size//2)], fill=color, width=2)
            # Small Cardinality label 'N'
            draw.text((x - size - 16, y - 14), "N", fill=color, font=font_card_badge)

    # One Side Helper
    def draw_one_side(draw, x, y, direction='right', color='#2563EB'):
        size = 8
        if direction == 'right':
            draw.line([(x + 6, y - size), (x + 6, y + size)], fill=color, width=2)
            draw.line([(x + 11, y - size), (x + 11, y + size)], fill=color, width=2)
            draw.text((x + 16, y - 14), "1", fill=color, font=font_card_badge)
        elif direction == 'left':
            draw.line([(x - 6, y - size), (x - 6, y + size)], fill=color, width=2)
            draw.line([(x - 11, y - size), (x - 11, y + size)], fill=color, width=2)
            draw.text((x - 22, y - 14), "1", fill=color, font=font_card_badge)

    # 2. Draw Navicat Orthogonal Relationship Lines
    p_hh = anchors.get(('grantee_list', 'hh_id'))
    LINE_COLOR = '#2563EB'
    LINE_WIDTH = 2

    if p_hh:
        # Mark 1-side on grantee_list
        draw_one_side(draw, p_hh['x_left'], p_hh['y_mid'], direction='left', color=LINE_COLOR)
        draw_one_side(draw, p_hh['x_right'], p_hh['y_mid'], direction='right', color=LINE_COLOR)

        # Rel 1: grantee_list.hh_id -> household_requests.hh_id
        p_hr = anchors.get(('household_requests', 'hh_id'))
        if p_hr:
            gutter_x = 670
            draw.line([(p_hh['x_left'], p_hh['y_mid']), (gutter_x, p_hh['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(gutter_x, p_hh['y_mid']), (gutter_x, p_hr['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(gutter_x, p_hr['y_mid']), (p_hr['x_right'], p_hr['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw_crows_foot(draw, p_hr['x_right'], p_hr['y_mid'], direction='right', color=LINE_COLOR)

        # Rel 2: grantee_list.hh_id -> emv_database.hh_id
        p_emv = anchors.get(('emv_database', 'hh_id'))
        if p_emv:
            draw.line([(p_hh['x_right'], p_hh['y_mid']), (1410, p_hh['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(1410, p_hh['y_mid']), (1410, p_emv['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(1410, p_emv['y_mid']), (p_emv['x_left'], p_emv['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw_crows_foot(draw, p_emv['x_left'], p_emv['y_mid'], direction='left', color=LINE_COLOR)

        # Rel 3: grantee_list.hh_id -> payroll.household_id
        p_pay = anchors.get(('payroll', 'household_id'))
        if p_pay:
            top_y = 160
            draw.line([(1410, p_hh['y_mid']), (1410, top_y)], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(1410, top_y), (2140, top_y)], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(2140, top_y), (2140, p_pay['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(2140, p_pay['y_mid']), (p_pay['x_left'], p_pay['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw_crows_foot(draw, p_pay['x_left'], p_pay['y_mid'], direction='left', color=LINE_COLOR)

        # Main Central Bus for Workflows (runs down in Gutter B at X = 1410)
        # Extends down to Y = 2175 so it cleanly meets the bottom branch for locking!
        draw.line([(1410, p_hh['y_mid']), (1410, 2175)], fill=LINE_COLOR, width=LINE_WIDTH)

        # Draw a small 1:N Bus indicator badge on the main trunk
        draw.rounded_rectangle([1395, 650, 1425, 668], radius=3, fill='#1E3A8A')
        draw.text((1399, 653), "1:N", fill='#FFFFFF', font=font_badge)

        # Connect Workflows in Col 2 (branch left from bus 1410 into X = 1360):
        for w_table in ['opening', 'transfer_of_fund', 'locking']:
            p_wf = anchors.get((w_table, 'household_id_number'))
            if p_wf:
                draw.line([(1410, p_wf['y_mid']), (p_wf['x_right'], p_wf['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
                draw_crows_foot(draw, p_wf['x_right'], p_wf['y_mid'], direction='right', color=LINE_COLOR)

        # Connect Workflows in Col 3 (branch right from bus 1410 into X = 1480):
        for w_table in ['distribution', 'otc_withdrawal', 'force_pin', 'lifting']:
            p_wf = anchors.get((w_table, 'household_id_number'))
            if p_wf:
                draw.line([(1410, p_wf['y_mid']), (p_wf['x_left'], p_wf['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
                draw_crows_foot(draw, p_wf['x_left'], p_wf['y_mid'], direction='left', color=LINE_COLOR)

        # Connect replacement in Col 4:
        p_rep = anchors.get(('replacement', 'household_id_number'))
        if p_rep:
            draw.line([(1410, 1205), (2140, 1205)], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(2140, 1205), (2140, p_rep['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw.line([(2140, p_rep['y_mid']), (p_rep['x_left'], p_rep['y_mid'])], fill=LINE_COLOR, width=LINE_WIDTH)
            draw_crows_foot(draw, p_rep['x_left'], p_rep['y_mid'], direction='left', color=LINE_COLOR)

    # Rel 4: request.name -> household_requests.request_name (Purple line)
    p_req = anchors.get(('request', 'name'))
    p_hr_req = anchors.get(('household_requests', 'request_name'))
    if p_req and p_hr_req:
        REQ_COLOR = '#7C3AED'
        draw_one_side(draw, p_req['x_left'], p_req['y_mid'], direction='left', color=REQ_COLOR)
        draw.line([(p_req['x_left'], p_req['y_mid']), (50, p_req['y_mid'])], fill=REQ_COLOR, width=2)
        draw.line([(50, p_req['y_mid']), (50, p_hr_req['y_mid'])], fill=REQ_COLOR, width=2)
        draw.line([(50, p_hr_req['y_mid']), (p_hr_req['x_left'], p_hr_req['y_mid'])], fill=REQ_COLOR, width=2)
        draw_crows_foot(draw, p_hr_req['x_left'], p_hr_req['y_mid'], direction='left', color=REQ_COLOR)

    # Rel 5: users.id -> household_requests.created_by (Slate line)
    p_user = anchors.get(('users', 'id'))
    p_hr_user = anchors.get(('household_requests', 'created_by'))
    if p_user and p_hr_user:
        USER_COLOR = '#64748B'
        draw_one_side(draw, p_user['x_left'], p_user['y_mid'], direction='left', color=USER_COLOR)
        draw.line([(p_user['x_left'], p_user['y_mid']), (30, p_user['y_mid'])], fill=USER_COLOR, width=2)
        draw.line([(30, p_user['y_mid']), (30, p_hr_user['y_mid'])], fill=USER_COLOR, width=2)
        draw.line([(30, p_hr_user['y_mid']), (p_hr_user['x_left'], p_hr_user['y_mid'])], fill=USER_COLOR, width=2)
        draw_crows_foot(draw, p_hr_user['x_left'], p_hr_user['y_mid'], direction='left', color=USER_COLOR)

    # 3. Draw Navicat ERD Canvas Header Block (Top Left)
    head_x, head_y, head_w, head_h = 80, 50, 1280, 110
    draw.rounded_rectangle([head_x, head_y, head_x + head_w, head_y + head_h], radius=8, fill='#1E293B')
    draw.rounded_rectangle([head_x + 2, head_y + 2, head_x + head_w - 2, head_y + head_h - 2], radius=7, fill='#0F172A', outline='#334155', width=1)

    # Modeler Logo Box
    draw.rounded_rectangle([head_x + 18, head_y + 18, head_x + 88, head_y + 88], radius=6, fill='#2563EB')
    draw.text((head_x + 24, head_y + 28), "ERD", fill='#FFFFFF', font=font_title)

    # Header Texts
    draw.text((head_x + 105, head_y + 20), "GRANTS — Grants Registry And Navigation Tracking System", fill='#FFFFFF', font=font_title)
    draw.text((head_x + 105, head_y + 55), "Physical Schema & Relational Map | Navicat Data Modeler Edition", fill='#94A3B8', font=font_subtitle)
    draw.text((head_x + 105, head_y + 78), "Primary Relational Backbone: grantee_list.hh_id (1) ───< Foreign Key References (*)", fill='#38BDF8', font=font_panel_title)

    # 4. Draw Navicat ERD Legend & Cardinality Card (Column 1, below household_requests)
    leg_x, leg_y, leg_w, leg_h = 80, 1400, 540, 480
    draw.rounded_rectangle([leg_x, leg_y, leg_x + leg_w, leg_y + leg_h], radius=6, fill='#FFFFFF', outline='#CBD5E1', width=1)
    draw.rounded_rectangle([leg_x, leg_y, leg_x + leg_w, leg_y + 36], radius=6, fill='#1E293B')
    draw.rectangle([leg_x, leg_y + 30, leg_x + leg_w, leg_y + 36], fill='#1E293B')
    draw.text((leg_x + 16, leg_y + 9), "DIAGRAM LEGEND & NOTATION", fill='#FFFFFF', font=font_panel_title)

    items = [
        ("PK", '#D97706', "Primary Key (Unique table identifier, auto-increment)"),
        ("FK", '#2563EB', "Foreign Key / Household Hub (Connected to grantee_list.hh_id)"),
        ("FK", '#7C3AED', "Catalog Reference (request.name -> household_requests)"),
        ("FK", '#64748B', "Audit Reference (users.id -> created_by staff tracking)"),
    ]
    curr_ly = leg_y + 50
    for badge_txt, b_color, desc in items:
        draw.rounded_rectangle([leg_x + 16, curr_ly, leg_x + 40, curr_ly + 16], radius=3, fill=b_color)
        draw.text((leg_x + 20, curr_ly + 2), badge_txt, fill='#FFFFFF', font=font_badge)
        draw.text((leg_x + 50, curr_ly + 2), desc, fill='#334155', font=font_panel_body)
        curr_ly += 28

    curr_ly += 10
    draw.line([leg_x + 16, curr_ly, leg_x + leg_w - 16, curr_ly], fill='#E2E8F0', width=1)
    curr_ly += 15

    draw.text((leg_x + 16, curr_ly), "CARDINALITY NOTATION (Crow's Foot):", fill='#0F172A', font=font_col_bold)
    curr_ly += 25

    # 1 Side
    draw.line([(leg_x + 20, curr_ly + 10), (leg_x + 60, curr_ly + 10)], fill='#2563EB', width=2)
    draw.line([(leg_x + 35, curr_ly + 2), (leg_x + 35, curr_ly + 18)], fill='#2563EB', width=2)
    draw.line([(leg_x + 42, curr_ly + 2), (leg_x + 42, curr_ly + 18)], fill='#2563EB', width=2)
    draw.text((leg_x + 75, curr_ly + 3), "1 : Exactly One (Master record in grantee_list)", fill='#334155', font=font_panel_body)
    curr_ly += 30

    # Many Side
    draw.line([(leg_x + 20, curr_ly + 10), (leg_x + 60, curr_ly + 10)], fill='#2563EB', width=2)
    draw.line([(leg_x + 50, curr_ly + 10), (leg_x + 60, curr_ly + 2)], fill='#2563EB', width=2)
    draw.line([(leg_x + 50, curr_ly + 10), (leg_x + 60, curr_ly + 18)], fill='#2563EB', width=2)
    draw.line([(leg_x + 42, curr_ly + 2), (leg_x + 42, curr_ly + 18)], fill='#2563EB', width=2)
    draw.text((leg_x + 75, curr_ly + 3), "N : Zero or Many (Transaction records / History)", fill='#334155', font=font_panel_body)
    curr_ly += 30

    curr_ly += 5
    draw.line([leg_x + 16, curr_ly, leg_x + leg_w - 16, curr_ly], fill='#E2E8F0', width=1)
    curr_ly += 15

    draw.text((leg_x + 16, curr_ly), "TABLE CATEGORY COLOR CODING:", fill='#0F172A', font=font_col_bold)
    curr_ly += 25

    cat_swatches = [
        ("Master Beneficiary (grantee_list)", '#1E40AF'),
        ("EMV Operations (emv_database)", '#065F46'),
        ("Payroll & Disbursements (payroll)", '#3730A3'),
        ("Central Requests & Catalog", '#5B21B6'),
        ("Service Request Workflows (8 Modules)", '#0369A1'),
        ("System Authentication (users)", '#334155'),
    ]
    for c_name, c_color in cat_swatches:
        draw.rectangle([leg_x + 16, curr_ly + 2, leg_x + 30, curr_ly + 14], fill=c_color)
        draw.text((leg_x + 38, curr_ly + 1), c_name, fill='#475569', font=font_panel_body)
        curr_ly += 22

    # 5. Draw Model Architecture & System Summary Card (Column 1, bottom)
    info_x, info_y, info_w, info_h = 80, 1910, 540, 480
    draw.rounded_rectangle([info_x, info_y, info_x + info_w, info_y + info_h], radius=6, fill='#FFFFFF', outline='#CBD5E1', width=1)
    draw.rounded_rectangle([info_x, info_y, info_x + info_w, info_y + 36], radius=6, fill='#0F172A')
    draw.rectangle([info_x, info_y + 30, info_x + info_w, info_y + 36], fill='#0F172A')
    draw.text((info_x + 16, info_y + 9), "HOUSEHOLD ID (hh_id) RELATIONAL ARCHITECTURE", fill='#FFFFFF', font=font_panel_title)

    desc_lines = [
        "In the GRANTS platform, grantee_list serves as the central",
        "master registry for all 4Ps beneficiaries. Every household is",
        "uniquely identified by its Household ID (hh_id).",
        "",
        "Cross-Table Foreign Key References to grantee_list.hh_id:",
        " • emv_database.hh_id  ──> EMV cash card tracking",
        " • payroll.household_id ──> Payroll releases & subsidies",
        " • household_requests.hh_id ──> Aggregated service requests",
        "",
        "The 8 Service Request Workflow Subsystems:",
        " • opening.household_id_number ──> Account Opening",
        " • distribution.household_id_number ──> Card Distribution",
        " • otc_withdrawal.household_id_number ──> OTC Withdrawal",
        " • replacement.household_id_number ──> Card Replacement",
        " • transfer_of_fund.household_id_number ──> Fund Transfer",
        " • force_pin.household_id_number ──> Force PIN Reset",
        " • locking.household_id_number ──> Card Locking",
        " • lifting.household_id_number ──> Card Lifting (Unlock)",
        "",
        "All 8 workflow modules maintain auditability through created_by",
        "referencing users.id, establishing complete staff accountability."
    ]
    curr_iy = info_y + 48
    for line in desc_lines:
        if line.startswith("Cross-Table") or line.startswith("The 8 Service"):
            draw.text((info_x + 16, curr_iy), line, fill='#0F172A', font=font_col_bold)
        elif line.startswith(" •"):
            draw.text((info_x + 16, curr_iy), line, fill='#2563EB', font=font_panel_body)
        else:
            draw.text((info_x + 16, curr_iy), line, fill='#475569', font=font_panel_body)
        curr_iy += 20

    # 6. Draw Right Info Panel (Column 4, below replacement)
    pan_x, pan_y, pan_w, pan_h = 2200, 1500, 640, 890
    draw.rounded_rectangle([pan_x, pan_y, pan_x + pan_w, pan_y + pan_h], radius=6, fill='#FFFFFF', outline='#CBD5E1', width=1)
    draw.rounded_rectangle([pan_x, pan_y, pan_x + pan_w, pan_y + 36], radius=6, fill='#1E3A8A')
    draw.rectangle([pan_x, pan_y + 30, pan_x + pan_w, pan_y + 36], fill='#1E3A8A')
    draw.text((pan_x + 16, pan_y + 9), "GRANTS DATA INTEGRITY & WORKFLOW MATRIX", fill='#FFFFFF', font=font_panel_title)

    flow_text = [
        ("1. Central Inquiries & Verification",
         "When an inquiry is made, the system performs a primary lookup on",
         "grantee_list using hh_id. If no match is found, the system displays",
         "the 'Household ID Not Found' alert. Upon confirmation, data is pulled",
         "from emv_database, payroll, and household_requests simultaneously."),
        
        ("2. Payroll Reconciliation Engine",
         "The payroll table stores disbursement records, grant breakdowns (health,",
         "education dc/elem, jr hs, sr hs, rice subsidy, f1kd), and financial statuses.",
         "Linked via household_id to maintain a complete lifetime payment ledger."),
         
        ("3. EMV Card Lifecycle Management",
         "The emv_database tracks physical LandBank EMV cash cards, run dates,",
         "distribution statuses, and servicing branches. Unclaimed cards prompt",
         "recommended actions for regional field workers."),
         
        ("4. Service Request Pipeline",
         "Household requests originate from municipal field offices and transition",
         "through 8 specialized lifecycle states (Opening, Distribution, OTC,",
         "Replacement, Fund Transfer, Force PIN, Locking, Lifting). Every record",
         "preserves historical grantee data, card numbers, remarks, and user tags.")
    ]

    curr_py = pan_y + 48
    for title, l1, l2, l3, *rest in flow_text:
        draw.text((pan_x + 16, curr_py), title, fill='#1E40AF', font=font_col_bold)
        curr_py += 22
        draw.text((pan_x + 16, curr_py), l1, fill='#334155', font=font_panel_body)
        curr_py += 18
        draw.text((pan_x + 16, curr_py), l2, fill='#334155', font=font_panel_body)
        curr_py += 18
        draw.text((pan_x + 16, curr_py), l3, fill='#334155', font=font_panel_body)
        curr_py += 18
        if rest:
            for extra in rest:
                draw.text((pan_x + 16, curr_py), extra, fill='#334155', font=font_panel_body)
                curr_py += 18
        curr_py += 16
        draw.line([pan_x + 16, curr_py, pan_x + pan_w - 16, curr_py], fill='#F1F5F9', width=1)
        curr_py += 16

    # Technical Specs Footer in Right Panel
    draw.text((pan_x + 16, curr_py), "DATABASE SPECIFICATIONS:", fill='#0F172A', font=font_col_bold)
    curr_py += 22
    specs = [
        " • Platform: Grants Registry And Navigation Tracking System (GRANTS)",
        " • Target DBMS: MariaDB 10.4+ / MySQL 8.0 Enterprise",
        " • Charset & Collation: utf8mb4_unicode_ci",
        " • Storage Engine: InnoDB with Foreign Key Cascade Constraints",
        " • Total Entities Represented: 14 relational tables",
        " • Central Indexing: INDEX(hh_id) on grantee_list & all child modules",
        " • Generated with Navicat Data Modeler High-Definition Palette"
    ]
    for s in specs:
        draw.text((pan_x + 16, curr_py), s, fill='#64748B', font=font_panel_body)
        curr_py += 20

    # Ensure output directories exist
    os.makedirs('public/images', exist_ok=True)
    out_file = 'public/images/erd_grants_navicat.png'
    img.save(out_file, 'PNG', quality=95)
    print(f"Successfully generated Navicat ERD: {out_file} ({WIDTH}x{HEIGHT})")

    # Also copy to artifact directory for embedded viewing
    artifact_dir = r"C:\Users\rnvaldehueza\.gemini\antigravity\brain\f4c88be4-39bf-4726-a697-4beceb63a77f"
    if os.path.exists(artifact_dir):
        artifact_out = os.path.join(artifact_dir, "erd_grants_navicat.png")
        shutil.copyfile(out_file, artifact_out)
        print(f"Successfully copied to artifact directory: {artifact_out}")

if __name__ == '__main__':
    generate_erd()

