import { Loader } from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMyNotesQuery } from "@/hooks/use-note";
import type { Note } from "@/types"; // Assurez-vous que le type Note existe
import { format } from "date-fns";
import { ArrowUpRight, FilterIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

const MyNotes = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilter = searchParams.get("filter") || "all";
  const initialSort = searchParams.get("sort") || "desc";
  const initialSearch = searchParams.get("search") || "";

  const [filter, setFilter] = useState<string>(initialFilter);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialSort === "asc" ? "asc" : "desc",
  );
  const [search, setSearch] = useState<string>(initialSearch);

  // Synchronisation avec l'URL
  useEffect(() => {
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    params.filter = filter;
    params.sort = sortDirection;
    params.search = search;

    setSearchParams(params, { replace: true });
  }, [filter, sortDirection, search]);

  useEffect(() => {
    const urlFilter = searchParams.get("filter") || "all";
    const urlSort = searchParams.get("sort") || "desc";
    const urlSearch = searchParams.get("search") || "";

    if (urlFilter !== filter) setFilter(urlFilter);
    if (urlSort !== sortDirection)
      setSortDirection(urlSort === "asc" ? "asc" : "desc");
    if (urlSearch !== search) setSearch(urlSearch);
  }, [searchParams]);

  const { data: myNotes, isLoading } = useGetMyNotesQuery() as {
    data: Note[];
    isLoading: boolean;
  };

  // Extraire les projets uniques pour le filtre
  const uniqueProjects: string[] = React.useMemo(() => {
    if (!myNotes || myNotes.length === 0) return [];
    const projectTitles = myNotes.map(
      (note) => note.project?.title ?? "Sans projet",
    );
    return Array.from(new Set(projectTitles));
  }, [myNotes]);

  // Filtrage et tri
  const filteredNotes = React.useMemo(() => {
    if (!myNotes || myNotes.length === 0) return [];

    let result = myNotes.filter((note) => {
      // Filtre par projet
      if (filter !== "all" && note.project?.title !== filter) return false;

      // Recherche textuelle (titre + contenu)
      if (search) {
        const searchLower = search.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(searchLower);
        const contentMatch = note.content?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }

      return true;
    });

    // Tri par date de dernière modification
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [myNotes, filter, search, sortDirection]);

  if (isLoading)
    return (
      <div>
        <Loader />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons de tri et filtre */}
      <div className="flex items-start md:items-center justify-between">
        <h1 className="text-2xl font-bold">My Notes</h1>

        <div className="flex flex-col items-start md:flex-row gap-2">
          <Button
            variant={"outline"}
            onClick={() =>
              setSortDirection(sortDirection === "asc" ? "desc" : "asc")
            }
          >
            {sortDirection === "asc" ? "Oldest First" : "Newest First"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant={"outline"}>
                  <FilterIcon className="w-4 h-4" /> Filter
                </Button>
              }
            />

            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All Projects
                </DropdownMenuItem>
                {uniqueProjects.map((project) => (
                  <DropdownMenuItem
                    key={project}
                    onClick={() => setFilter(project)}
                  >
                    {project}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Input
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        {/* VUE LISTE */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>My Notes</CardTitle>
              <CardDescription>
                {filteredNotes.length} note{filteredNotes.length !== 1 && "s"}{" "}
                across your projects
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="divide-y">
                {filteredNotes.map((note) => (
                  <div key={note._id} className="p-4 hover:bg-muted/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3">
                      <div className="flex-1">
                        <Link
                          to={`/workspaces/${note.project?.workspace}/projects/${note.project?._id}/`}
                          className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                        >
                          {note.title}
                          <ArrowUpRight className="size-4 ml-1" />
                        </Link>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {note.project?.title && (
                            <Badge variant="outline">
                              {note.project.title}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            by {note.createdBy?.name ?? "Unknown"}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {note.content || "No content"}
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Modified on {format(note.updatedAt, "PPpp")}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredNotes.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notes found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VUE GRILLE */}
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Card
                key={note._id}
                className="hover:shadow-md transition-shadow flex flex-col"
              >
                <Link
                  to={`/workspaces/${note.project?.workspace}/projects/${note.project?._id}/`}
                  className="block p-4 flex-1"
                >
                  <h3 className="font-medium">{note.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                    {note.content || "No content"}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <Badge variant="outline">
                      {note.project?.title ?? "No project"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(note.updatedAt, "PP")}
                    </span>
                  </div>
                </Link>
              </Card>
            ))}

            {filteredNotes.length === 0 && (
              <div className="col-span-full p-4 text-center text-sm text-muted-foreground">
                No notes found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyNotes;
