```mermaid                                                                                                                               
    flowchart LR                                                                                                                             
        subgraph Source Configurations                                                                                                       
            direction TB                                                                                                                     
            Stack[".agents/stack.toml<br>(Shared definitions)"]                                                                              
            ClaudeSettings[".claude/settings.json<br>(Hooks & Plugins)"]                                                                     
            ClaudePluginManifest["plugins/nxtlvl-labs/<br>.claude-plugin/plugin.json"]
	end
           
        Compiler(["scripts/sync-agent-configs.ts<br><i>npm run sync-agent-configs</i>"])
    
        Stack -->|Reads| Compiler
	ClaudeSettings -->|Reads| Compiler
        ClaudePluginManifest -->|Reads| Compiler
    
        subgraph Standard Provider Outputs
	   direction TB
            Claude[".mcp.json"]
            Codex[".codex/config.toml"]
            Devin[".devin/config.local.json"]
            Grok[".grok/settings.json"]      
	end
           
        subgraph Gemini Auto-Generation
	   direction TB
            GeminiSettings[".gemini/settings.json<br><i>Translates CLAUDE_PROJECT_DIR<br>Merges mcpServers</i>"]
            GeminiPluginManifest["plugins/nxtlvl-labs/<br>plugin.json<br><i>Translates 'Claude Code' label</i>"]
	end
           
        Compiler -->|Generates| Claude
        Compiler -->|Generates| Codex 
        Compiler -->|Generates| Devin
        Compiler -->|Generates| Grok 
    
        Compiler -->|Translates & Merges| GeminiSettings
        Compiler -->|Translates| GeminiPluginManifest   
    ```