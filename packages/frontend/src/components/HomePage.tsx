import React, { useState, useEffect } from 'react';
import Select from 'react-select';

interface SelectedOption {
    value: string;
    label: string;
}

const HomePage: React.FC = () => {
    const [projects, setProjects] = useState<SelectedOption[]>([]);
    const [selectedProject, setSelectedProject] = useState<SelectedOption | null>(null);
    const [repositories, setRepositories] = useState<SelectedOption[]>([]);
    const [selectedRepositories, setSelectedRepositories] = useState<SelectedOption[]>([]);

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

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                const response = await fetch(`/repositories${selectedProject ? `?project_name=${selectedProject.value}` : ''}`);
                const data = await response.json();
                setRepositories(data.map((repository: string) => ({
                    value: repository,
                    label: repository
                })));
            } catch (error) {
                console.error('Error fetching repositories:', error);
            }
        };

        fetchRepositories();
    }, [selectedProject]);

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
                        className="w-full max-w-md mb-4"
                    />
                    <Select
                        options={repositories}
                        value={selectedRepositories}
                        onChange={(newValue) => setSelectedRepositories(newValue as SelectedOption[])}
                        placeholder="Select repositories..."
                        isSearchable
                        isMulti
                        className="w-full max-w-md"
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;