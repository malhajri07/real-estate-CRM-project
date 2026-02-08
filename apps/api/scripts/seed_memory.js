const seed = async () => {
    try {
        console.log('Sending request to http://localhost:3000/api/knowledge...');
        const response = await fetch('http://localhost:3000/api/knowledge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentId: 'antigravity-agent',
                type: 'TASK_COMPLETION',
                status: 'SUCCESS',
                summary: 'Completed API Evaluation and Remediation against Architectural Standards.',
                tags: ['API', 'Refactor', 'Localization', 'Auth', 'Architecture'],
                details: {
                    task: 'API Evaluation & Remediation',
                    accomplishments: [
                        'Analyzed 03-api-architect.md standards',
                        'Implemented Localization Infrastructure',
                        'Refactored Auth Module',
                        'Implemented Knowledge Base Service'
                    ]
                }
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
};

seed();
