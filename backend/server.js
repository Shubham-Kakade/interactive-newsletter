<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creative Weekly Newsletter</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }
        .diagonal-cut { clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); }
        .diagonal-cut-reverse { clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%); }
        .asymmetric-border { border-left: 8px solid transparent; border-image: linear-gradient(45deg, #2c5282, #9333ea) 1; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .offset-content { margin-left: 0 !important; margin-right: 0 !important; }
            .large-news { font-size: 22px !important; }
            .floating-element { position: relative !important; transform: none !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8f9fa 0%, #e2e8f0 100%);">
    <div class="container">
        <!-- Asymmetric Header -->
        <div class="diagonal-cut" style="background: linear-gradient(135deg, #2c5282 0%, #9333ea 100%); padding: 40px 40px 60px; position: relative;">
            <div style="position: absolute; top: 20px; right: 20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.6;"></div>
            <div style="position: absolute; bottom: 30px; left: 60px; width: 40px; height: 40px; background: rgba(255,255,255,0.15); transform: rotate(45deg); border-radius: 8px;"></div>
            
            <div style="text-align: left; position: relative; z-index: 2;">
                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <span style="color: #ffffff; font-weight: bold; font-size: 24px;">N</span>
                </div>
                <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.1;">
                    Creative<br/>
                    <span style="font-size: 24px; opacity: 0.9;">Weekly Digest</span>
                </h1>
                <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px; max-width: 300px;">Asymmetric insights & bold perspectives</p>
            </div>
        </div>

        <!-- Dynamic Content Grid -->
        <div style="background-color: #ffffff; padding: 0; position: relative;">
            <!-- Floating Welcome -->
            <div class="floating-element" style="background: linear-gradient(120deg, #f1f5f9, #e2e8f0); padding: 30px; margin: -20px 20px 40px; border-radius: 16px; box-shadow: 0 20px 40px -12px rgba(44, 82, 130, 0.15); transform: rotate(-1deg);">
                <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.7; font-style: italic;">
                    "Breaking the conventional newsletter mold – here's what caught our attention this week..."
                </p>
            </div>

            <!-- Large Feature Story -->
            <div style="padding: 0 40px 40px; position: relative;">
                <div class="asymmetric-border" style="background: linear-gradient(45deg, rgba(44, 82, 130, 0.05), rgba(147, 51, 234, 0.05)); padding: 30px; border-radius: 0 20px 20px 0; margin-left: -20px;">
                    <span style="background: linear-gradient(135deg, #2c5282, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Featured</span>
                    <h2 class="large-news" style="color: #1e293b; margin: 10px 0 15px; font-size: 26px; font-weight: 700; line-height: 1.2;">
                        The Asymmetric Revolution in Digital Innovation
                    </h2>
                    <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                        Groundbreaking research reveals how asymmetrical design patterns are reshaping user experiences across industries. Early adopters report 40% higher engagement rates.
                    </p>
                </div>
            </div>

            <!-- Offset Grid Items -->
            <div style="display: flex; flex-wrap: wrap; gap: 20px; padding: 0 40px 40px;">
                <!-- Small Story 1 -->
                <div style="flex: 1; min-width: 250px; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; transform: rotate(1deg); box-shadow: 0 8px 25px -8px rgba(0,0,0,0.1);">
                    <h3 style="color: #9333ea; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
                        Market Disruption Alert
                    </h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">
                        Q4 results show unprecedented shifts in consumer behavior patterns...
                    </p>
                </div>

                <!-- Small Story 2 -->
                <div style="flex: 1; min-width: 250px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; padding: 20px; transform: rotate(-0.5deg); box-shadow: 0 8px 25px -8px rgba(0,0,0,0.1);">
                    <h3 style="color: #2c5282; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
                        Sustainability Breakthrough
                    </h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">
                        Revolutionary carbon capture technology promises 60% efficiency gains...
                    </p>
                </div>
            </div>

            <!-- Diagonal Call to Action -->
            <div class="diagonal-cut-reverse" style="background: linear-gradient(45deg, #2c5282 0%, #1e40af 50%, #9333ea 100%); padding: 50px 40px 70px; text-align: center; position: relative;">
                <div style="position: absolute; top: 15px; left: 30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.4;"></div>
                
                <h3 style="color: #ffffff; margin: 0 0 20px; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Dive Deeper
                </h3>
                <a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(10px); transition: all 0.3s ease;">
                    Explore Full Stories →
                </a>
            </div>
        </div>

        <!-- Creative Footer -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; position: relative;">
            <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: rgba(147, 51, 234, 0.1); border-radius: 0 0 0 100%; opacity: 0.6;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
                <div style="flex: 1;">
                    <h4 style="color: #ffffff; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Stay Connected</h4>
                    <div style="margin-bottom: 20px;">
                        <a href="#" style="color: #94a3b8; text-decoration: none; margin-right: 20px; font-size: 14px; font-weight: 500;">Twitter</a>
                        <a href="#" style="color: #94a3b8; text-decoration: none; margin-right: 20px; font-size: 14px; font-weight: 500;">LinkedIn</a>
                        <a href="#" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;">Medium</a>
                    </div>
                </div>
                <div style="flex: 1; text-align: right;">
                    <p style="color: #94a3b8; margin: 0 0 8px; font-size: 13px; line-height: 1.5;">
                        Creative Weekly | Innovation District<br/>
                        Future Street 42, Digital City
                    </p>
                    <p style="color: #64748b; margin: 0; font-size: 11px;">
                        <a href="#" style="color: #9333ea; text-decoration: none;">Unsubscribe</a> | 
                        <a href="#" style="color: #9333ea; text-decoration: none;">Preferences</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
