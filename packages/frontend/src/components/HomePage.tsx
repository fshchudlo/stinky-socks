import React, { useState, useEffect } from 'react';
import Select from 'react-select';

interface ProjectOption {
    value: string;
    label: string;
}

const HomePage: React.FC = () => {
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch('/projects');
                const data = await response.json();
                setProjects(data.map((project: string) => ({
                    value: project,
                    label: project
                })));
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="sticky top-0 z-10 bg-white shadow-md p-4">
                <div className="max-w-7xl mx-auto">
                    <Select
                        options={projects}
                        value={selectedProject}
                        onChange={(newValue) => setSelectedProject(newValue)}
                        placeholder="Select a project..."
                        isSearchable
                        className="w-full max-w-md"
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage; 